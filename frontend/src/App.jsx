import React, { useEffect, useState } from 'react';
import SensorCard from './SensorCard';
import { getSensorData } from './api';
import './App.css';

function App() {
  const [sensors, setSensors] = useState([]);

  useEffect(() => {
    const mockData = [
      { id: 1, name: 'Nhiệt độ', value: '27°C' },
      { id: 2, name: 'Độ ẩm', value: '60%' },
      { id: 3, name: 'Ánh sáng', value: '350 lux' },
    ];
    setSensors(mockData);
  }, []);

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
    <div>
      <h1>Sensor Dashboard</h1>
      <div className="sensor-container">
        {sensors.map(sensor => (
          <SensorCard key={sensor.id} sensor={sensor} />
        ))}
      </div> 
    </div>
  );
}

export default App;
