// src/components/AlertHistoryTable.jsx
import React, { useEffect, useState, useMemo } from "react";
import { getSensorHistory } from "../api";

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

const parseTimeMs = (value) => {
  if (!value || typeof value !== "string") return 0;
  const [timePart, datePart] = value.split(" ");
  if (!timePart || !datePart) return 0;
  const [hh, mm, ss] = timePart.split(":").map(Number);
  const [dd, mo, yyyy] = datePart.split("/").map(Number);
  if (!yyyy || !mo || !dd) return 0;
  return new Date(yyyy, mo - 1, dd, hh || 0, mm || 0, ss || 0).getTime();
};

const levelForValue = (sensorKey, value, thresholds) => {
  const cfg = thresholds[sensorKey];
  if (!cfg || value == null) return "normal";
  if (cfg.dir === "high") {
    if (value > cfg.threshold * 1.5) return "critical";
    if (value > cfg.threshold) return "warning";
    return "normal";
  }
  if (value < cfg.threshold / 1.5) return "critical";
  if (value < cfg.threshold) return "warning";
  return "normal";
};

export default function AlertHistoryTable() {
  const [alerts, setAlerts] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    // fetch a larger set and paginate client-side
    // request latest 20 minutes sampled every 5s -> 20*60/5 = 240
    const fetchLatest = async () => {
      try {
        const thresholds = readThresholds();
        const count = 240;
        const sensors = ["temp", "humi", "light"];
        const results = await Promise.all(
          sensors.map((key) => getSensorHistory(key, count, { force: true }))
        );
        if (!mounted) return;
        const merged = [];
        results.forEach((hist, idx) => {
          const key = sensors[idx];
          if (!Array.isArray(hist)) return;
          hist.forEach((point) => {
            const level = levelForValue(key, point.value, thresholds);
            if (level !== "normal") {
              merged.push({
                time: point.time,
                sensorKey: key,
                sensor: key,
                value: point.value,
                level,
                _ts: parseTimeMs(point.time),
              });
            }
          });
        });
        merged.sort((a, b) => (b._ts || 0) - (a._ts || 0));
        const cleaned = merged.slice(0, count).map(({ _ts, ...rest }) => rest);
        setAlerts(cleaned);
      } catch (err) {
        console.error("Error fetching alert history:", err);
        if (mounted) setAlerts([]);
      }
    };
    // initial load
    fetchLatest();
    // poll for new alerts every 5 seconds
    const id = setInterval(fetchLatest, 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  // reset page when pageSize changes
  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const total = alerts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const visible = useMemo(() => {
    const start = (page - 1) * pageSize;
    return alerts.slice(start, start + pageSize);
  }, [alerts, page, pageSize]);

  const csvEscape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };

  const exportCSV = () => {
    if (!alerts || alerts.length === 0) return;
    const header = "Thời gian,Sensor,Giá trị,Mức cảnh báo\n";
    const rowsCsv = alerts
      .map(
        (a) =>
          `${csvEscape(a.time)},${csvEscape(a.sensor)},${csvEscape(
            a.value
          )},${csvEscape(a.level)}`
      )
      .join("\n");
    const blob = new Blob([header + rowsCsv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "alert_history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div
        className="filter-export"
        style={{ justifyContent: "flex-end", marginBottom: 10 }}
      >
        <label className="filter-label">
          Hiện:
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            style={{ marginLeft: 8 }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>
        </label>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginLeft: 12,
          }}
        >
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </button>
          <span className="page-indicator">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Sensor</th>
              <th>Giá trị</th>
              <th>Mức cảnh báo</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan="4" className="empty-cell">
                  Không có alert
                </td>
              </tr>
            )}
            {visible.map((a, i) => (
              <tr key={i}>
                <td data-label="Thời gian">{a.time}</td>
                <td data-label="Sensor">{a.sensor}</td>
                <td data-label="Giá trị">{a.value}</td>
                <td
                  data-label="Mức cảnh báo"
                  className={`level level-${a.level}`}
                >
                  {a.level}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="export-csv-fixed">
        <button onClick={exportCSV} disabled={alerts.length === 0}>
          Export CSV
        </button>
      </div>
    </div>
  );
}
