import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import './App.css';

function SensorChart({ data }) {
  return (
    <div className="sensor-chart">
      <h3>Biểu đồ Nhiệt độ</h3>

      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis dataKey="time" stroke="#aaa" />
          <YAxis stroke="#aaa" />
          <Tooltip />
          <Legend />

          <Line type="monotone" dataKey="temp" name="Nhiệt độ" stroke="#ff000dff" strokeWidth={2} />
          <Line type="monotone" dataKey="humi" name="Độ ẩm" stroke="#0099ffff" strokeWidth={2} />
          <Line type="monotone" dataKey="light" name="Ánh sáng" stroke="#ffff00" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SensorChart;
