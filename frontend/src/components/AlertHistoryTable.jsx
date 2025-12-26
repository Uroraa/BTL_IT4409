// src/components/AlertHistoryTable.jsx
import React, { useEffect, useState } from 'react';
import { getAlertHistory } from '../mocks/sensor.mock';

export default function AlertHistoryTable() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    let mounted = true;
    getAlertHistory(10).then(data => {
      if (mounted) setAlerts(data);
    });
    return () => { mounted = false; }
  }, []);

  return (
    <div className="table-wrap">
      <table className="history-table">
        <thead>
          <tr>
            <th>Thời gian</th>
            <th>Sensor</th>
            <th>Giá trị</th>
            <th>Mức</th>
          </tr>
        </thead>
        <tbody>
          {alerts.length === 0 && (
            <tr><td colSpan="4">Không có alert</td></tr>
          )}
          {alerts.map((a, i) => (
            <tr key={i}>
              <td>{a.time}</td>
              <td>{a.sensor}</td>
              <td>{a.value}</td>
              <td className={`level level-${a.level}`}>{a.level}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
