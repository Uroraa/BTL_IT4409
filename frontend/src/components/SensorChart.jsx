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
import '../App.css';

function SensorChart({ data, visibleLines, onPointClick }) {
  return (
    <div className="sensor-chart">
      <h3>Biểu đồ Realtime</h3>

      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis
            dataKey="time.display"
            stroke="#e7dcdcff"
            tickFormatter={(value, index) => (typeof index === 'number' ? String(index + 1) : value)}
          />
          <YAxis stroke="#aaa" />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f1724', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: '#fff' }}
            labelStyle={{ color: '#9ca3af', fontWeight: 600 }}
            labelFormatter={(label) => label}
          />
          <Legend />
          {visibleLines.temp && (
            <Line
              type="monotone"
              dataKey="temp"
              name="Nhiệt độ"
              stroke="#ff000de0"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{
                r: 6,
                onClick: (_, index) => onPointClick(data[index])
              }}
            />
          )}
          {visibleLines.humi && (
            <Line
              type="monotone"
              dataKey="humi"
              name="Độ ẩm"
              stroke="#0099ffd5"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{
                r: 6,
                onClick: (_, index) => onPointClick(data[index])
              }}
            />
          )}
          {visibleLines.light && (
            <Line
              type="monotone"
              dataKey="light"
              name="Ánh sáng"
              stroke="#c9c919ff"
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{
                r: 6,
                onClick: (_, index) => onPointClick(data[index])
              }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SensorChart;
