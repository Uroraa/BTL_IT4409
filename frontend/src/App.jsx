import React, { useEffect, useState } from 'react';
import SensorCard from './SensorCard';
import SensorChart from './SensorChart';
import { getSensorData } from './api';
import './App.css';

function App() {
  const [sensors, setSensors] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const mockData = [
      { id: 1, name: 'Nhiệt độ', value: '27°C' },
      { id: 2, name: 'Độ ẩm', value: '60%' },
      { id: 3, name: 'Ánh sáng', value: '350 lux' },
    ];
    setSensors(mockData);

    const mockChart = [
      { time: "10:00", temp: 25, humi: 55, light: 50 },
      { time: "10:10", temp: 30, humi: 57, light: 77 },
      { time: "10:20", temp: 27, humi: 60, light: 80 },
      { time: "10:30", temp: 32, humi: 62, light: 90 }
    ];
    setChartData(mockChart);
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
        
      <SensorChart data={chartData} />
    </div>
  );
}

export default App;
