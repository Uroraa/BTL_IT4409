// src/components/SensorHistoryTable.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { getSensorHistory } from '../api';

const DEFAULT_THRESHOLDS = {
  temp: { threshold: 26, dir: 'high', unit: '°C' },
  humi: { threshold: 45, dir: 'low', unit: '%' },
  light: { threshold: 600, dir: 'low', unit: 'lux' },
};

const readThresholds = () => {
  try {
    const raw = localStorage.getItem('app:thresholds');
    if (!raw) return DEFAULT_THRESHOLDS;
    const parsed = JSON.parse(raw);
    if (parsed.light && parsed.light.dir === 'high') {
      return DEFAULT_THRESHOLDS;
    }
    return { ...DEFAULT_THRESHOLDS, ...parsed };
  } catch {
    return DEFAULT_THRESHOLDS;
  }
};

const levelForValue = (sensorKey, value, thresholds) => {
  const cfg = thresholds[sensorKey];
  if (!cfg || value == null) return 'normal';
  if (cfg.dir === 'high') {
    if (value > cfg.threshold * 1.5) return 'critical';
    if (value > cfg.threshold) return 'warning';
    return 'normal';
  }
  if (value < cfg.threshold / 1.5) return 'critical';
  if (value < cfg.threshold) return 'warning';
  return 'normal';
};

export default function SensorHistoryTable() {
  const [sensor, setSensor] = useState('temp');
  const [rows, setRows] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [thresholds, setThresholds] = useState(readThresholds);

  const url = "http://localhost:6969/api/data/history?sensor=" + sensor + "&limit=240";

  useEffect(() => {
    let mounted = true;
    // fetch a larger set and paginate client-side
    // request latest 20 minutes sampled every 5s -> 20*60/5 = 240
    const fetchLatest = () => {
      getSensorHistory(sensor, 240, { force: true }).then(data => {
        if (mounted) setRows([...data].reverse());
      });
    };
    // initial load
    fetchLatest();
    // poll for new data every 5 seconds
    const id = setInterval(fetchLatest, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, [sensor]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, sensor]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'app:thresholds') setThresholds(readThresholds());
    };
    const onCustom = () => setThresholds(readThresholds());
    window.addEventListener('storage', onStorage);
    window.addEventListener('thresholds:updated', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('thresholds:updated', onCustom);
    };
  }, []);

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const visible = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  const csvEscape = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };

  const sensorNames = { temp: 'Nhiệt độ', humi: 'Độ ẩm', light: 'Ánh sáng' };

  const exportCSV = () => {
    if (!rows || rows.length === 0) return;
    const header = 'Thời gian,type,Giá trị,Mức cảnh báo\n';
    const rowsCsv = rows.map(r => {
      const level = levelForValue(sensor, r.value, thresholds);
      return `${csvEscape(r.time)},${csvEscape(sensorNames[sensor] || sensor)},${csvEscape(r.value)},${csvEscape(level || '')}`;
    }).join('\n');
    const blob = new Blob([header + rowsCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sensor}_history.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div className="filter-row">
          <label>
            Sensor:
            <select value={sensor} onChange={e => setSensor(e.target.value)} style={{ marginLeft: 8 }}>
              <option value="temp">Nhiệt độ</option>
              <option value="humi">Độ ẩm</option>
              <option value="light">Ánh sáng</option>
            </select>
          </label>
        </div>

        <div className="filter-export" style={{ gap: 10 }}>
          <label className="filter-label">
            Hiện:
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} style={{ marginLeft: 8 }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
            <span className="page-indicator">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Giá trị</th>
              <th>Mức cảnh báo</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => {
              const computed = levelForValue(sensor, r.value, thresholds);
              const show = computed && computed !== 'normal';
              return (
                <tr key={i}>
                  <td data-label="Thời gian">{r.time}</td>
                  <td data-label="Giá trị">{r.value}</td>
                  <td data-label="Mức cảnh báo" className={show ? `level level-${computed}` : ''}>{show ? computed : ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="export-csv-fixed">
        <button onClick={exportCSV} disabled={rows.length === 0}>Export CSV</button>
      </div>
    </div>
  );
}
