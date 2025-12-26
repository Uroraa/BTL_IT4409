// src/components/SensorHistoryTable.jsx
import React, { useEffect, useState } from 'react';
import { getSensorHistory } from '../mocks/sensor.mock';

export default function SensorHistoryTable() {
  const [sensor, setSensor] = useState('temp');
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let mounted = true;
    getSensorHistory(sensor, 10).then(data => {
      if (mounted) setRows(data);
    });
    return () => { mounted = false; };
  }, [sensor]);

  return (
    <div>
      <div className="filter-row">
        <label>
          Sensor:
          <select value={sensor} onChange={e => setSensor(e.target.value)}>
            <option value="temp">Nhiệt độ</option>
            <option value="humi">Độ ẩm</option>
            <option value="light">Ánh sáng</option>
          </select>
        </label>
      </div>

      <div className="table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Giá trị</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.time}</td>
                <td>{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
