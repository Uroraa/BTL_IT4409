// src/components/SensorHistoryTable.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { getSensorHistory, getLevelForValue } from '../api';


export default function SensorHistoryTable() {
  const [sensor, setSensor] = useState('temp');
  const [rows, setRows] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;
    // fetch a larger set and paginate client-side
    // request latest 20 minutes sampled every 5s -> 20*60/5 = 240
    getSensorHistory(sensor, 240).then(data => {
      if (mounted) setRows(data);
    });
    return () => { mounted = false; };
  }, [sensor]);

  useEffect(() => {
    setPage(1);
  }, [pageSize, sensor]);

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const visible = useMemo(() => {
    const start = (page - 1) * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

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
              const computed = getLevelForValue(sensor, r.value);
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
    </div>
  );
}
