import React, { useEffect, useState } from "react";
import "../App.css";

const DEFAULTS = {
  temp: { threshold: 26, dir: "high", unit: "°C" },
  humi: { threshold: 45, dir: "low", unit: "%" },
  light: { threshold: 60, dir: "high", unit: "lux" },
};

const STORAGE_KEY = "app:thresholds";

function loadThresholds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULTS, ...parsed };
  } catch {
    return DEFAULTS;
  }
}

export default function Thresholds() {
  const [values, setValues] = useState(loadThresholds);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let t = null;
    if (saved) {
      t = setTimeout(() => setSaved(false), 1800);
    }
    return () => clearTimeout(t);
  }, [saved]);

  const handleChange = (key, field, rawValue) => {
    setValues((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: field === "threshold" ? Number(rawValue) : rawValue,
      },
    }));
  };

  const save = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      // notify other open tabs/components
      try {
        window.dispatchEvent(
          new CustomEvent("thresholds:updated", { detail: values })
        );
      } catch {}
      setSaved(true);
    } catch (err) {
      console.warn("save thresholds error", err);
    }
  };

  const reset = () => {
    setValues(DEFAULTS);
  };

  return (
    <div className="app-container">
      <h1>Thiết lập ngưỡng cảnh báo</h1>

      <div className="control-box thresholds-control">
        <div className="thresholds-grid">
          <div className="grid-header">
            <div>Sensor</div>
            <div>Ngưỡng</div>
            <div>Hướng</div>
            <div>Đơn vị</div>
          </div>

          {["temp", "humi", "light"].map((key) => (
            <div key={key} className="threshold-row">
              <div className="sensor-label">
                {key === "temp"
                  ? "Nhiệt độ"
                  : key === "humi"
                  ? "Độ ẩm"
                  : "Ánh sáng"}
              </div>

              <div className="threshold-cell">
                <input
                  className="threshold-input"
                  type="number"
                  value={values[key].threshold}
                  onChange={(e) =>
                    handleChange(key, "threshold", e.target.value)
                  }
                  aria-label={`${key}-threshold`}
                />
              </div>

              <div className="direction-cell">
                <select
                  className="direction-select"
                  value={values[key].dir}
                  onChange={(e) => handleChange(key, "dir", e.target.value)}
                  aria-label={`${key}-dir`}
                >
                  <option value="high">Cao (giám sát vượt trên)</option>
                  <option value="low">Thấp (giám sát xuống dưới)</option>
                </select>
              </div>

              <div className="unit-cell">{values[key].unit}</div>
            </div>
          ))}

          <div className="grid-actions">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button className="btn-primary" onClick={save}>
                Lưu
              </button>
              <button className="btn-ghost" onClick={reset}>
                Khôi phục mặc định
              </button>
              {saved && <span className="saved-indicator">Đã lưu</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
