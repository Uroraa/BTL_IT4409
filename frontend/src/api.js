import { generateSensorMock, getSensorHistory as mockSensorHistory, getAlertHistory as mockAlertHistory } from './mocks/sensor.mock';

const BACKEND_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';



  // prefer Vite env, fall back to default
  

async function tryFetchJson(url, opts) {
  try {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error('bad response ' + res.status);
    const json = await res.json();
    return json;
  } catch (err) {
    console.warn('api fetch failed', url, err.message);
    return null;
  }
}

// In-memory cache so data is fetched once per page load and reused across components.
const appCache = {
  dashboard: null,
  dashboardPromise: null,
  dashboardKey: null,
  sensorHistories: {}, // key: `${sensor}:${count}` => data or promise
  alertHistory: null,
  alertPromise: null,
  mockBase: null // single mock dataset used as fallback for all endpoints
};

export async function fetchDashboardData({ limit = 10, timeRange = 'ALL' } = {}) {
  const cacheKey = `dashboard:${limit}:${timeRange}`;
  if (appCache.dashboard && appCache.dashboardKey === cacheKey) return appCache.dashboard;
  if (appCache.dashboardPromise && appCache.dashboardKey === cacheKey) return appCache.dashboardPromise;

  appCache.dashboardKey = cacheKey;
  appCache.dashboardPromise = (async () => {
    // try backend endpoint; keep compatibility with earlier simple /sensors path
    const url1 = `${BACKEND_BASE}/sensors?limit=${limit}&timeRange=${encodeURIComponent(timeRange)}`;
    const url2 = `${BACKEND_BASE}/api/data?limit=${limit}&timeRange=${encodeURIComponent(timeRange)}`;

    let json = await tryFetchJson(url1);
    if (!json) json = await tryFetchJson(url2);

    let result = null;
    if (json) {
      // Accept either { data: [...] } or raw array
      if (Array.isArray(json)) result = json;
      else if (Array.isArray(json.data)) result = json.data;
    }

    if (!result) {
      // fallback to mock; create a larger consistent mock base so other endpoints can derive from it
      const base = generateSensorMock(Math.max(limit, 60));
      appCache.mockBase = base;
      // return the latest `limit` entries
      result = base.slice(-limit);
    } else {
      // If backend returned data, don't override existing mockBase
      if (!appCache.mockBase) appCache.mockBase = null;
    }

    appCache.dashboard = result;
    appCache.dashboardPromise = null;
    return result;
  })();

  return appCache.dashboardPromise;
}

export async function getSensorHistory(sensorKey, count = 10) {
  const key = `${sensorKey}:${count}`;
  if (appCache.sensorHistories[key]) {
    return appCache.sensorHistories[key];
  }

  const p = (async () => {
    const url = `${BACKEND_BASE}/history?sensor=${encodeURIComponent(sensorKey)}&count=${count}`;
    const url2 = `${BACKEND_BASE}/api/history?sensor=${encodeURIComponent(sensorKey)}&count=${count}`;

    let json = await tryFetchJson(url);
    if (!json) json = await tryFetchJson(url2);

    if (json) {
      if (Array.isArray(json)) return json;
      if (Array.isArray(json.data)) return json.data;
    }

    // fallback: derive from single mock base so all components share same mock data
    if (!appCache.mockBase || (Array.isArray(appCache.mockBase) && appCache.mockBase.length < count)) {
      appCache.mockBase = generateSensorMock(Math.max(60, count));
    }

    // map mock base to sensor-specific history
    const arr = appCache.mockBase.map(pt => ({ time: (pt.time && (pt.time.display || pt.time.minute)) || '', value: pt[sensorKey] }));
    // return last `count` entries
    return arr.slice(-count);
  })();

  appCache.sensorHistories[key] = p;
  const resolved = await p;
  appCache.sensorHistories[key] = resolved;
  return resolved;
}

export async function getAlertHistory(count = 10) {
  if (appCache.alertHistory) return appCache.alertHistory;
  if (appCache.alertPromise) return appCache.alertPromise;

  appCache.alertPromise = (async () => {
    const url = `${BACKEND_BASE}/alerts?count=${count}`;
    const url2 = `${BACKEND_BASE}/api/alerts?count=${count}`;

    let json = await tryFetchJson(url);
    if (!json) json = await tryFetchJson(url2);

    if (json) {
      const res = Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : []);
      appCache.alertHistory = res;
      appCache.alertPromise = null;
      return res;
    }

    // fallback: derive alerts from mockBase consistently
    if (!appCache.mockBase || (Array.isArray(appCache.mockBase) && appCache.mockBase.length < count)) {
      appCache.mockBase = generateSensorMock(Math.max(60, count));
    }

    // thresholds same as mock
    const thresholds = {
      temp: { threshold: 35, dir: 'high' },
      humi: { threshold: 40, dir: 'low' },
      light: { threshold: 50, dir: 'low' }
    };

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

    const alerts = [];
    ['temp', 'humi', 'light'].forEach(sensorKey => {
      appCache.mockBase.forEach(point => {
        const level = getLevelForValue(sensorKey, point[sensorKey]);
        if (level !== 'normal') {
          alerts.push({ time: (point.time && (point.time.display || point.time.minute)) || '', sensorKey, sensor: sensorKey, value: point[sensorKey], level });
        }
      });
    });

    // newest first
    const result = alerts.reverse().slice(0, count);
    appCache.alertHistory = result;
    appCache.alertPromise = null;
    return result;
  })();

  return appCache.alertPromise;
}

export function getLevelForValue(sensorKey, value) {
  const thresholds = {
    temp: { threshold: 35, dir: 'high' },
    humi: { threshold: 40, dir: 'low' },
    light: { threshold: 50, dir: 'low' }
  };

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
