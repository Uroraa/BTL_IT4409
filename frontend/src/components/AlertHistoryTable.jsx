// src/components/AlertHistoryTable.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { getAlertHistory } from '../api';

export default function AlertHistoryTable() {
  const [alerts, setAlerts] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    // fetch a larger set and paginate client-side
    // request latest 20 minutes sampled every 5s -> 20*60/5 = 240
    getAlertHistory(240).then(data => {
      if (mounted) setAlerts(data);
    });
    return () => { mounted = false; }
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

  return (
    <div>
      <div className="filter-export" style={{ justifyContent: 'flex-end', marginBottom: 10 }}>
        <label className="filter-label">
          Hiện:
          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            style={{ marginLeft: 8 }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={15}>15</option>
          </select>
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
          <span className="page-indicator">{page} / {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</button>
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
              <tr><td colSpan="4" className="empty-cell">Không có alert</td></tr>
            )}
            {visible.map((a, i) => (
              <tr key={i}>
                <td data-label="Thời gian">{a.time}</td>
                <td data-label="Sensor">{a.sensor}</td>
                <td data-label="Giá trị">{a.value}</td>
                <td data-label="Mức cảnh báo" className={`level level-${a.level}`}>{a.level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
