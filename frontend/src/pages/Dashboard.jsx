import React, { useEffect, useState } from "react";
import SensorCard from "../components/SensorCard";
import SensorChart from "../components/SensorChart";
import { fetchDashboardData } from "../api";
import io from "socket.io-client";
import "../App.css";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:6969";
function Dashboard() {
  const [sensors, setSensors] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [timeRange, setTimeRange] = useState("ALL");
  const [limit, setLimit] = useState(10);

  const [realtimeData, setRealtimeData] = useState(null);

  const [visibleLines, setVisibleLines] = useState({
    temp: true,
    humi: true,
    light: true,
  });

  const RAW_GRAFANA = import.meta.env.VITE_GRAFANA_URL;
  const DEFAULT_GRAFANA = "http://localhost:3001";
  const GRAFANA_BASE =
    RAW_GRAFANA && RAW_GRAFANA.trim()
      ? RAW_GRAFANA.replace(/\/+$/, "")
      : import.meta.env.DEV
      ? DEFAULT_GRAFANA
      : "";

  const grafanaUrl = (path) => {
    const cleanedPath = path.startsWith("/") ? path : `/${path}`;
    if (!GRAFANA_BASE) return cleanedPath;
    return `${GRAFANA_BASE}${cleanedPath}`;
  };

  // thresholds are persisted in localStorage so the "Thresholds" page can update them
  const DEFAULT_THRESHOLDS = {
    temp: { threshold: 26, dir: "high", unit: "°C" },
    humi: { threshold: 45, dir: "low", unit: "%" },
    light: { threshold: 600, dir: "low", unit: "lux" },
  };

  const readThresholds = () => {
    try {
      const raw = localStorage.getItem("app:thresholds");
      if (!raw) return DEFAULT_THRESHOLDS;
      const parsed = JSON.parse(raw);
      if (parsed.light && parsed.light.dir === "high") {
        return DEFAULT_THRESHOLDS;
      }
      return { ...DEFAULT_THRESHOLDS, ...parsed };
    } catch {
      return DEFAULT_THRESHOLDS;
    }
  };

  const [thresholds, setThresholds] = useState(readThresholds);

  const getAlertStatus = (key, value) => {
    if (value === null || value === undefined) return "normal";
    const cfg = thresholds[key];
    if (!cfg) return "normal";

    if (cfg.dir === "high") {
      if (value > cfg.threshold) return "alert";
    } else {
      if (value < cfg.threshold) return "alert";
    }
    return "normal";
  };

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "app:thresholds") setThresholds(readThresholds());
    };
    window.addEventListener("storage", onStorage);
    // also listen to custom event from same tab
    const onCustom = () => setThresholds(readThresholds());
    window.addEventListener("thresholds:updated", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("thresholds:updated", onCustom);
    };
  }, []);

  const getStatus = (key, value) => {
    const cfg = thresholds[key];
    if (!cfg) return "normal";
    if (cfg.dir === "high") {
      if (value > cfg.threshold * 1.5) return "critical";
      if (value > cfg.threshold) return "warning";
      return "normal";
    } else {
      if (value < cfg.threshold / 1.5) return "critical";
      if (value < cfg.threshold) return "warning";
      return "normal";
    }
  };

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socket.on("new_data", (newData) => {
      setRealtimeData(newData); // Cập nhật state realtime
    });
    return () => socket.disconnect();
  }, []);

  //fetchData (uses centralized api with mock fallback)
  let unsortedData = [];
  const fetchData = async () => {
    try {
      const data = await fetchDashboardData({ limit, timeRange });
      unsortedData = Array.from(data || []);
      if (unsortedData.length > 0) {
        const lastItem = unsortedData[unsortedData.length - 1];
        setRealtimeData((prev) => prev || lastItem);
      }
    } catch (err) {
      console.error("fetchData error", err);
      unsortedData = [];
    }
  };
  // Toggle sensor
  const handleToggle = (key) => {
    setVisibleLines((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const filteredData = React.useMemo(() => {
    if (timeRange === "ALL") return chartData;
    if (timeRange === "LAST_1") return chartData.slice(-1);
    if (timeRange === "LAST_3") return chartData.slice(-3);
    return chartData;
  }, [chartData, timeRange]);

  //Ham xu li xuat file
  const exportCSV = () => {
    if (chartData.length === 0) return;

    const csvEscape = (v) => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      if (/[,"\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
      return s;
    };

    const timeStr = (t) => {
      if (!t && t !== 0) return "";
      if (typeof t === "string") return t;
      if (typeof t === "number") return new Date(t).toISOString();
      if (t && typeof t === "object")
        return (
          t.display || t.minute || (t.ts ? new Date(t.ts).toISOString() : "")
        );
      return "";
    };

    const header = "time,temp,humi,light\n";
    const rows = chartData
      .map(
        (d) =>
          `${csvEscape(timeStr(d.time))},${csvEscape(d.temp)},${csvEscape(
            d.humi
          )},${csvEscape(d.light)}`
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "sensor_data.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  // Inline status-based coloring is used instead of top alerts.

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await fetchData();
      if (cancelled) return;

      const sortedData = (unsortedData || []).slice().sort((a, b) => {
        const ta = (a && a.time && a.time.ts) || 0;
        const tb = (b && b.time && b.time.ts) || 0;
        return ta - tb;
      });

      if (!sortedData || sortedData.length === 0) {
        setChartData([]);
        setSensors([]);
        return;
      }

      setChartData(sortedData);
      const last = sortedData[sortedData.length - 1];
      const mockData = [
        {
          id: 1,
          key: "temp",
          name: "Nhiệt độ",
          value: last.temp,
          display: `${last.temp} °C`,
          status: getStatus("temp", last.temp),
        },
        {
          id: 2,
          key: "humi",
          name: "Độ ẩm",
          value: last.humi,
          display: `${last.humi} %`,
          status: getStatus("humi", last.humi),
        },
        {
          id: 3,
          key: "light",
          name: "Ánh sáng",
          value: last.light,
          display: `${last.light} lux`,
          status: getStatus("light", last.light),
        },
      ];
      setSensors(mockData);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const current = realtimeData || {};

  // useEffect(() => {
  //   const fetchData = async () => {
  //     const data = await getSensorData();
  //     setSensors(data);
  //   };

  //   fetchData();
  //   const interval = setInterval(fetchData, 2000);
  //   return () => clearInterval(interval);
  // }, []);

  return (
    <div className="app-container">
      <h1>Sensor Dashboard</h1>

      <div className="alert-blocks-container">
        {/* NHIỆT ĐỘ */}
        <div className={`alert-card ${getAlertStatus("temp", current.temp)}`}>
          <div className="icon">🌡️</div>
          <div className="info">
            <h3>Nhiệt độ</h3>

            <div className="status-text">
              {getAlertStatus("temp", current.temp) === "alert"
                ? "CẢNH BÁO CAO!"
                : "Ổn định"}
            </div>
          </div>
        </div>

        {/* ĐỘ ẨM */}
        <div className={`alert-card ${getAlertStatus("humi", current.humi)}`}>
          <div className="icon">💧</div>
          <div className="info">
            <h3>Độ ẩm</h3>

            <div className="status-text">
              {getAlertStatus("humi", current.humi) === "alert"
                ? "CẢNH BÁO THẤP!"
                : "Ổn định"}
            </div>
          </div>
        </div>

        {/* ÁNH SÁNG */}
        <div className={`alert-card ${getAlertStatus("light", current.light)}`}>
          <div className="icon">💡</div>
          <div className="info">
            <h3>Ánh sáng</h3>

            <div className="status-text">
              {getAlertStatus("light", current.light) === "alert"
                ? "CẢNH BÁO THẤP!"
                : "Đủ sáng"}
            </div>
          </div>
        </div>
      </div>
      {/* <div className="sensor-container">
        {sensors.map(sensor => (
          <SensorCard key={sensor.id} sensor={sensor} />
        ))}
      </div> */}

      {/* <div className="control-box controls-horizontal">
        <div className="controls-flex">
          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={visibleLines.temp}
                onChange={() => handleToggle("temp")}
              /> Nhiệt độ
            </label>

            <label>
              <input
                type="checkbox"
                checked={visibleLines.humi}
                onChange={() => handleToggle("humi")}
              /> Độ ẩm
            </label>

            <label>
              <input
                type="checkbox"
                checked={visibleLines.light}
                onChange={() => handleToggle("light")}
              /> Ánh sáng
            </label>
          </div>

          <div className="filter-export">
            <label>
              Lọc thời gian:
              <select
                value={timeRange}
                onChange={e => setTimeRange(e.target.value)}
              >
                <option value="ALL">Tất cả</option>
                <option value="LAST_1">1 phút gần nhất</option>
                <option value="LAST_3">3 phút gần nhất</option>
              </select>
            </label>

            
          </div>
        </div>
      </div> */}

      {/* <SensorChart
        data={filteredData}
        visibleLines={visibleLines}
        onPointClick={setSelectedPoint}
      /> */}
      {/* <div className="iframe-center">
        <iframe src={grafanaUrl("/d-solo/adm9ztp/new-dashboard?orgId=1&timezone=browser&refresh=5s&theme=dark&panelId=panel-1&__feature.dashboardSceneSolo=true")} width="600" height="400" frameborder="0"></iframe>
      </div> */}

      <div className="metric-container">
        <div className="temp-metric">
          <iframe
            src={grafanaUrl(
              "/public-dashboards/e86f390796034576af3419c49fdb55c4"
            )}
            frameborder="0"
            scrolling="no"
          ></iframe>
        </div>
        <div className="humi-metric">
          <iframe
            src={grafanaUrl(
              "/public-dashboards/0cabc4a8cdea4f768838ea0297d20083"
            )}
            frameborder="0"
            scrolling="no"
          ></iframe>
        </div>
        <div className="light-metric">
          <iframe
            src={grafanaUrl(
              "/public-dashboards/4d4a7420cbae461e9d171dd70a1f4fd8"
            )}
            frameborder="0"
            scrolling="no"
          ></iframe>
        </div>
      </div>

      <div className="graph-container">
        <div className="graph-wrapper">
          <iframe
            src={grafanaUrl(
              "/public-dashboards/9c703e8abb1a42b095f7325b0b702885"
            )}
            frameborder="0"
            scrolling="no"
          ></iframe>
        </div>
      </div>

      <div className="export-csv-fixed">
        <button onClick={exportCSV}>Export CSV</button>
      </div>

      {/* {selectedPoint && (
        <div className="detail-panel">
          <h3>Chi tiết tại {selectedPoint.time}</h3>
          <p>Nhiệt độ: {selectedPoint.temp} °C</p>
          <p>Độ ẩm: {selectedPoint.humi} %</p>
          <p>Ánh sáng: {selectedPoint.light} lux</p>
        </div>
      )} */}
    </div>
  );
}

export default Dashboard;
