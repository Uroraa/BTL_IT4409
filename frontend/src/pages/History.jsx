import React, { useEffect, useState } from 'react';
import AlertHistoryTable from '../components/AlertHistoryTable';
import SensorHistoryTable from '../components/SensorHistoryTable';
import '../App.css';

export default function History() {
  const [tab, setTab] = useState('alerts');

  return (
    <div className="app-container history-page">
      <h1>Lịch sử hệ thống</h1>

      <div className="history-tabs">
        <button className={tab === 'alerts' ? 'tab active' : 'tab'} onClick={() => setTab('alerts')}>Lịch sử alert</button>
        <button className={tab === 'sensor' ? 'tab active' : 'tab'} onClick={() => setTab('sensor')}>Lịch sử dữ liệu từng sensor</button>
      </div>

      {tab === 'alerts' && <AlertHistoryTable />}
      {tab === 'sensor' && <SensorHistoryTable />}
    </div>
  );
}
