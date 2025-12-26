// ===== Threshold config (GIỐNG Dashboard) =====
const thresholds = {
  temp: { name: 'Nhiệt độ', threshold: 35, dir: 'high', unit: '°C' },
  humi: { name: 'Độ ẩm', threshold: 40, dir: 'low', unit: '%' },
  light: { name: 'Ánh sáng', threshold: 50, dir: 'low', unit: 'lux' }
};

// ===== Utils =====
function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ===== MOCK 1: realtime/dashboard data (GIỮ NGUYÊN, chỉ clean lại) =====
export function generateSensorMock(count = 10) {
  return Array.from({ length: count }).map((_, i) => ({
    time: {
      minute: String(i),
      display: `00:${String(i).padStart(2, '0')}`
    },
    temp: rand(10, 100),
    humi: rand(10, 100),
    light: rand(10, 100)
  }));
}

// ===== MOCK 2: history per sensor =====
export function generateSensorHistory(sensorKey, count = 10) {
  const now = Date.now();
  const arr = [];

  for (let i = 0; i < count; i++) {
    const t = new Date(now - (count - 1 - i) * 60 * 1000); // mỗi điểm cách 1 phút
    const hh = String(t.getHours()).padStart(2, '0');
    const mm = String(t.getMinutes()).padStart(2, '0');

    arr.push({
      time: `${hh}:${mm}`,
      value: rand(10, 100)
    });
  }

  return arr;
}

// ===== Alert level logic (GIỐNG Dashboard) =====
function getLevelForValue(sensorKey, value) {
  const cfg = thresholds[sensorKey];
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
}

// ===== MOCK API: async history per sensor =====
export async function getSensorHistory(sensorKey, count = 10) {
  await new Promise(r => setTimeout(r, 120)); // giả lập latency
  return generateSensorHistory(sensorKey, count);
}

// ===== MOCK API: alert history (tổng hợp từ các sensor) =====
export async function getAlertHistory(count = 10) {
  await new Promise(r => setTimeout(r, 120)); // giả lập latency

  const sensors = ['temp', 'humi', 'light'];
  const alerts = [];

  sensors.forEach(sensorKey => {
    const hist = generateSensorHistory(sensorKey, count);

    hist.forEach(point => {
      const level = getLevelForValue(sensorKey, point.value);
      if (level !== 'normal') {
        alerts.push({
          time: point.time,
          sensorKey,
          sensor: thresholds[sensorKey].name,
          sensorName: thresholds[sensorKey].name,
          value: point.value,
          unit: thresholds[sensorKey].unit,
          level
        });
      }
    });
  });

  // sắp xếp mới nhất lên trước
  return alerts.reverse();
}
