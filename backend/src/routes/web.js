import express from 'express';
import { getData, getDefault, postData, getHistory, getAlerts } from '../service/DataService.js';
import { handleAlert } from '../service/GrafanaService.js';

const router = express.Router();

router.get('/', getDefault);
router.get('/api/data', getData);
router.get('/api/history', getHistory);
router.get('/api/alerts', getAlerts);

router.post('/api/data', postData);
router.post('/api/grafana/alert', handleAlert);


export default router;