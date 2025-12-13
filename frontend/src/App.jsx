import React, { useEffect, useState } from 'react';
import SensorCard from './components/SensorCard';
import SensorChart from './components/SensorChart';
import { getSensorData } from './api';
import './App.css';

function App() {
  const [data, setData] = React.useState([]);
  const [sensors, setSensors] = useState([]);
  const [chartData, setChartData] = useState([]);

  const fetchData = () => {
    const url = `http://localhost:3001/api/data`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setData(data.data);
      })
      .catch(err => console.error(err));
  };
  React.useEffect(() => {
    fetchData();
  }, []);

  const [visibleLines, setVisibleLines] = useState({
    temp: true,
    humi: true,
    light: true
  });

  // Toggle sensor  
  const handleToggle = (key) => {
    setVisibleLines(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  useEffect(() => {
    const mockData = [
      { id: 1, name: 'Nhiệt độ', value: '32°C' },
      { id: 2, name: 'Độ ẩm', value: '62%' },
      { id: 3, name: 'Ánh sáng', value: '90 lux' },
    ];
    setSensors(mockData);

    // const mockChart = [
    //   { time: "10:00", temp: 25, humi: 55, light: 50 },
    //   { time: "10:01", temp: 30, humi: 57, light: 77 },
    //   { time: "10:02", temp: 27, humi: 60, light: 80 },
    //   { time: "10:03", temp: 32, humi: 62, light: 90 }
    // ];

    // setChartData(mockChart);
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

      <div className="toggle-container">
        <label>
          <input
            type="checkbox"
            checked={visibleLines.temp}
            onChange={() => handleToggle("temp")}
          /> Nhiệt độ
        </label>

        <label>
          <input
            type="checkbox"
            checked={visibleLines.humi}
            onChange={() => handleToggle("humi")}
          /> Độ ẩm
        </label>

        <label>
          <input
            type="checkbox"
            checked={visibleLines.light}
            onChange={() => handleToggle("light")}
          /> Ánh sáng
        </label>
      </div>

      <SensorChart
        data={data}
        visibleLines={visibleLines}
      />
    </div>
  );
}

export default App;
