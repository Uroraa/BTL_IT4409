import models from "../db/index.js";
import io from "../config/io.config.js";

const Data = models.Data;

const handleTranferDate = (isoTimeString) => {
  const dateObject = new Date(isoTimeString);
  return {
    hour: dateObject.getHours(),
    minute: dateObject.getMinutes(),
    second: dateObject.getSeconds(),
    day: dateObject.getDate(),
    month: dateObject.getMonth() + 1,
    year: dateObject.getFullYear(),
  };
};
const getDefault = (req, res) => {
  res.send("Server is running");
};

const getData = async (req, res) => {
  try {
    // Lấy 50 dòng mới nhất để load trang cho nhanh, thay vì lấy all
    const data = await Data.find({}).sort({ _id: -1 }).limit(50);
    data.reverse();
    res.status(200).json({
      message: "Lấy dữ liệu thành công.",
      data: data,
    });
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu:", error);
    res.status(400).json({ Error: error.message });
  }
};

const postData = async (req, res) => {
  try {
    const isoTimeString = req.body.time || new Date().toISOString();
    const time = handleTranferDate(isoTimeString);
    const { temp, humi, light } = req.body;
    const newData = await Data.create({ time, temp, humi, light });

    // Cũng bắn socket khi thêm qua API
    io.emit("new_data", newData);

    res.status(200).json({
      message: "Gửi dữ liệu thành công",
      data: newData,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};



const formatTimeDisplay = (timeObj) => {
  if (!timeObj) return '';
  let dateObject = null;
  if (typeof timeObj === 'string' || timeObj instanceof Date) {
    const parsed = new Date(timeObj);
    if (!Number.isNaN(parsed.getTime())) dateObject = parsed;
  }

  const hh = String(dateObject ? dateObject.getHours() : (timeObj.hour ?? 0)).padStart(2, '0');
  const mm = String(dateObject ? dateObject.getMinutes() : (timeObj.minute ?? 0)).padStart(2, '0');
  const ss = String(dateObject ? dateObject.getSeconds() : (timeObj.second ?? 0)).padStart(2, '0');
  const dd = String(dateObject ? dateObject.getDate() : (timeObj.day ?? 0)).padStart(2, '0');
  const mo = String(dateObject ? (dateObject.getMonth() + 1) : (timeObj.month ?? 0)).padStart(2, '0');
  const yyyy = String(dateObject ? dateObject.getFullYear() : (timeObj.year ?? ''));
  // dd/MM/yyyy HH:mm:ss
  return `${hh}:${mm}:${ss} ${dd}/${mo}/${yyyy}`;
};

const getHistory = async (req, res) => {
  try {
    const sensor = req.query.sensor || 'temp';
    const limit = parseInt(req.query.limit) || 240;
    const data = await Data.find({}).sort({ _id: -1 }).limit(limit);
    // newest first from DB; reverse to chronological
    data.reverse();
    const arr = data.map(pt => ({ time: formatTimeDisplay(pt.time), value: pt[sensor] }));
    return res.status(200).json(arr);
  } catch (error) {
    console.error('Error in getHistory', error);
    return res.status(500).json({ error: error.message });
  }

};

const getAlerts = async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 10;
    // fetch a reasonably large recent window to detect alerts
    const fetchLimit = Math.max(240, count * 10);
    const data = await Data.find({}).sort({ _id: -1 }).limit(fetchLimit);

    const thresholds = {

      temp: { threshold: 26, dir: 'high' },

      humi: { threshold: 45, dir: 'low' },

      light: { threshold: 60, dir: 'high' }

    }
      ;

    function levelFor(sensorKey, value) {
      const cfg = thresholds[sensorKey];
      if (!cfg || value == null) return 'normal';
      if (cfg.dir === 'high') {
        if (value > cfg.threshold * 1.5) return 'critical';
        if (value > cfg.threshold) return 'warning';
        return 'normal';
      } else {
        if (value < cfg.threshold / 1.5) return 'critical';
        if (value < cfg.threshold) return 'warning';
        return 'normal';
      }
    }

    const alerts = [];
    data.forEach(pt => {
      ['temp', 'humi', 'light'].forEach(sensorKey => {
        const lvl = levelFor(sensorKey, pt[sensorKey]);
        if (lvl !== 'normal') {
          alerts.push({ time: formatTimeDisplay(pt.time), sensorKey, sensor: sensorKey, value: pt[sensorKey], level: lvl });
        }
      });
    });

    // newest first and limit
    const result = alerts.reverse().slice(0, count);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in getAlerts', error);
    return res.status(500).json({ error: error.message });
  }
};

export {
  handleTranferDate,
  getDefault,
  getData,
  postData,
  getHistory,
  getAlerts
};
