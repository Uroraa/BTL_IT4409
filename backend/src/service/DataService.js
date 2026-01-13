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
    // Sử dụng giờ Việt Nam (UTC+7) nếu không có time trong request
    const now = new Date();
    const vietnamTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const isoTimeString = req.body.time || vietnamTime.toISOString();
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



const VN_TZ_OFFSET_MIN = -7 * 60;

const toVietnamDate = (date) => {
  if (!(date instanceof Date)) return null;
  const localOffsetMin = date.getTimezoneOffset();
  const diffMin = localOffsetMin - VN_TZ_OFFSET_MIN;
  return new Date(date.getTime() + diffMin * 60 * 1000);
};

const formatTimeDisplay = (timeObj) => {
  if (!timeObj) return '';
  if (timeObj instanceof Date) {
    const vnDate = toVietnamDate(timeObj) || timeObj;
    const hh = String(vnDate.getHours()).padStart(2, '0');
    const mm = String(vnDate.getMinutes()).padStart(2, '0');
    const ss = String(vnDate.getSeconds()).padStart(2, '0');
    const dd = String(vnDate.getDate()).padStart(2, '0');
    const mo = String(vnDate.getMonth() + 1).padStart(2, '0');
    const yyyy = String(vnDate.getFullYear());
    return `${hh}:${mm}:${ss} ${dd}/${mo}/${yyyy}`;
  }
  const hh = String(timeObj.hour ?? 0).padStart(2, '0');
  const mm = String(timeObj.minute ?? 0).padStart(2, '0');
  const ss = String(timeObj.second ?? 0).padStart(2, '0');
  const dd = String(timeObj.day ?? 0).padStart(2, '0');
  const mo = String(timeObj.month ?? 0).padStart(2, '0');
  const yyyy = String(timeObj.year ?? '');
  // dd/MM/yyyy HH:mm:ss
  return `${hh}:${mm}:${ss} ${dd}/${mo}/${yyyy}`;
};

const isValidTimeObj = (timeObj) => {
  if (!timeObj || typeof timeObj !== 'object') return false;
  const year = Number(timeObj.year);
  const month = Number(timeObj.month);
  const day = Number(timeObj.day);
  if (!year || !month || !day) return false;
  return true;
};

const getDocTime = (doc) => {
  if (doc?.createdAt instanceof Date) return doc.createdAt;
  if (doc?._id && typeof doc._id.getTimestamp === 'function') {
    return doc._id.getTimestamp();
  }
  if (doc?.time && typeof doc.time === 'object' && isValidTimeObj(doc.time)) {
    return doc.time;
  }
  return null;
};

const getDocTimeMs = (doc) => {
  const t = getDocTime(doc);
  if (t instanceof Date) return t.getTime();
  if (t && typeof t === 'object' && isValidTimeObj(t)) {
    const year = Number(t.year);
    const month = Number(t.month) - 1;
    const day = Number(t.day);
    const hour = Number(t.hour ?? 0);
    const minute = Number(t.minute ?? 0);
    const second = Number(t.second ?? 0);
    return new Date(year, month, day, hour, minute, second).getTime();
  }
  return null;
};

const getHistory = async (req, res) => {
  try {
    const sensor = req.query.sensor || 'temp';
    const limit = parseInt(req.query.limit) || 240;
    const fetchLimit = Math.max(limit * 3, limit);
    const data = await Data.find({}).sort({ _id: -1 }).limit(fetchLimit);
    // newest first from DB; reverse to chronological
    data.reverse();
    const bucketMs = 5000;
    const deduped = [];
    let lastBucket = null;
    data.forEach(pt => {
      const ms = getDocTimeMs(pt);
      if (ms == null) {
        deduped.push(pt);
        lastBucket = null;
        return;
      }
      const bucket = Math.floor(ms / bucketMs);
      if (bucket === lastBucket) {
        // Replace with the newest record in the same 5s bucket.
        deduped[deduped.length - 1] = pt;
        return;
      }
      lastBucket = bucket;
      deduped.push(pt);
    });

    const arr = deduped
      .slice(-limit)
      .map(pt => ({ time: formatTimeDisplay(getDocTime(pt)), value: pt[sensor] }));
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
          alerts.push({ time: formatTimeDisplay(getDocTime(pt)), sensorKey, sensor: sensorKey, value: pt[sensorKey], level: lvl });
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
