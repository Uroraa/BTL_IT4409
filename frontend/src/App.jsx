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
  const [limit, setLimit] = useState(5);

  const [visibleLines, setVisibleLines] = useState({
    temp: true,
    humi: true,
    light: true
  });

  const thresholds = {
    temp: { threshold: 35, dir: 'high', unit: '°C' },
    humi: { threshold: 40, dir: 'low', unit: '%' },
    light: { threshold: 50, dir: 'low', unit: 'lux' }
  };

  const getStatus = (key, value) => {
    const cfg = thresholds[key];
    if (!cfg) return 'normal';
    if (cfg.dir === 'high') {
      if (value > cfg.threshold * 1.5) return 'critical';
      if (value > cfg.threshold) return 'warning';
      return 'normal';
    } else {
      if (value < cfg.threshold / 1.5) return 'critical';
      if (value < cfg.threshold) return 'warning';
      return 'normal';
    }
  };
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
    if (timeRange === "LAST_1") return chartData.slice(-1);
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

  // Inline status-based coloring is used instead of top alerts.


  useEffect(() => {

    fetchData();
    setTimeout(() => {
      // If no real data returned, generate mock data to test alerts
      if (!unsortedData || unsortedData.length === 0) {
        const tempValues = [30, 34, 36, 40, 20, 40];
        const humiValues = [45, 38, 30, 20, 50, 10];
        const lightValues = [100, 60, 40, 20, 10, 5];
        unsortedData = tempValues.map((t, i) => ({
          time: { minute: String(i), display: `00:${String(i).padStart(2, '0')}` },
          temp: t,
          humi: humiValues[i],
          light: lightValues[i]
        }));
      }

      const sortedData = unsortedData.sort((a, b) => {
        return parseInt(a.time.minute) - parseInt(b.time.minute);
      })
      setChartData(sortedData);
      const last = sortedData[sortedData.length - 1];
      const mockData = [
        { id: 1, key: 'temp', name: 'Nhiệt độ', value: last.temp, display: `${last.temp} °C`, status: getStatus('temp', last.temp) },
        { id: 2, key: 'humi', name: 'Độ ẩm', value: last.humi, display: `${last.humi} %`, status: getStatus('humi', last.humi) },
        { id: 3, key: 'light', name: 'Ánh sáng', value: last.light, display: `${last.light} lux`, status: getStatus('light', last.light) },
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
