import React from 'react';
import './App.css';

function SensorCard({ sensor }) {
  return (
    <div className="sensor-card">
      <h3>{sensor.name}</h3>
      <p>Value: {sensor.value}</p>
    </div>
  );
}

export default SensorCard;
