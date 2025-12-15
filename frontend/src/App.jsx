import React, { useEffect, useState } from 'react';
import SensorCard from './components/SensorCard';
import SensorChart from './components/SensorChart';
import { getSensorData } from './api';
import './App.css';

function App() {
  const [sensors, setSensors] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [timeRange, setTimeRange] = useState("ALL");
  const [alerts, setAlerts] = useState([]);
  const [limit, setLimit] = useState(5);

  const [visibleLines, setVisibleLines] = useState({
    temp: true,
    humi: true,
    light: true
  });
  //fetchData
  let unsortedData = [];
  const fetchData = () => {
    const url = `http://localhost:3001/api/data?timeRange=${timeRange}&limit=${limit}`;
    fetch(url)
      .then(res => res.json())
      .then(data => { unsortedData = Array.from(data.data) })
      .catch(err => console.error(err))
  }
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

  //Ham xu li xuat file
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

    fetchData();
    setTimeout(() => {
      const sortedData = unsortedData.sort((a, b) => {
        return parseInt(a.time.minute) - parseInt(b.time.minute);
      })
      setChartData(sortedData);
      const mockData = [
        { id: 1, name: 'Nhiệt độ', value: `${sortedData[sortedData.length - 1].temp} °C` },
        { id: 2, name: 'Độ ẩm', value: `${sortedData[sortedData.length - 1].humi} %` },
        { id: 3, name: 'Ánh sáng', value: `${sortedData[sortedData.length - 1].light} lux` },
      ];
      setSensors(mockData);

    }, 1500);

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
