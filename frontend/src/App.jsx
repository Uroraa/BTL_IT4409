import React, { useEffect, useState } from 'react';
import SensorCard from './components/SensorCard';
import SensorChart from './components/SensorChart';
import { getSensorData } from './api';
import './App.css';

function App() {
  const [data, setData] = React.useState([]);
  const [sensors, setSensors] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [timeRange, setTimeRange] = useState("ALL");
  const [alerts, setAlerts] = useState([]);

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

  const filteredData = React.useMemo(() => {
    if (timeRange === "ALL") return chartData;
    if (timeRange === "LAST_2") return chartData.slice(-2);
    if (timeRange === "LAST_3") return chartData.slice(-3);
    return chartData;
  }, [chartData, timeRange]);

  const exportCSV = () => {
    if (chartData.length === 0) return;

    const header = "time,temp,humi,light\n";
    const rows = chartData
      .map(d => `${d.time},${d.temp},${d.humi},${d.light}`)
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "sensor_data.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (chartData.length === 0) return;

    const last = chartData[chartData.length - 1];
    const newAlerts = [];

    if (last.temp > 35) {
      newAlerts.push("Nhiệt độ vượt ngưỡng an toàn!");
    }

    if (last.humi < 40) {
      newAlerts.push("Độ ẩm quá thấp!");
    }

    if (last.light < 50) {
      newAlerts.push("Ánh sáng quá tối!");
    }

    setAlerts(newAlerts);
  }, [chartData]);


  useEffect(() => {
    const mockData = [
      { id: 1, name: 'Nhiệt độ', value: '32°C' },
      { id: 2, name: 'Độ ẩm', value: '62%' },
      { id: 3, name: 'Ánh sáng', value: '90 lux' },
    ];
    setSensors(mockData);

    const mockChart = [
      { time: "10:00", temp: 25, humi: 55, light: 50 },
      { time: "10:01", temp: 30, humi: 57, light: 77 },
      { time: "10:02", temp: 27, humi: 60, light: 80 },
      { time: "10:03", temp: 32, humi: 62, light: 90 },
      { time: "10:02", temp: 36, humi: 30, light: 40 }
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
    <div className="app-container">
      <h1>Sensor Dashboard</h1>

      {alerts.length > 0 && (
        <div className="alert-container">
          {alerts.map((msg, index) => (
            <div
              key={index}
              className="alert-box"
            >
              {msg}
            </div>
          ))}
        </div>
      )}


      <div className="sensor-container">
        {sensors.map(sensor => (
          <SensorCard key={sensor.id} sensor={sensor} />
        ))}
      </div>

      <div className="control-box">
        <div className="checkbox-group">
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
      </div>

      <div className="control-box">
        <div className="filter-export">
          <label>
            Lọc thời gian:
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
            >
              <option value="ALL">Tất cả</option>
              <option value="LAST_2">2 phút gần nhất</option>
              <option value="LAST_3">3 phút gần nhất</option>
            </select>
          </label>

          <button onClick={exportCSV}>Export CSV</button>
        </div>
      </div>

      <SensorChart
        data={filteredData}
        visibleLines={visibleLines}
        onPointClick={setSelectedPoint}
      />

      {selectedPoint && (
        <div className="detail-panel">
          <h3>Chi tiết tại {selectedPoint.time}</h3>
          <p>Nhiệt độ: {selectedPoint.temp} °C</p>
          <p>Độ ẩm: {selectedPoint.humi} %</p>
          <p>Ánh sáng: {selectedPoint.light} lux</p>
        </div>
      )}
    </div>
  );
}

export default App;
