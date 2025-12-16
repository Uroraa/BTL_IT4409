import express from 'express';
import { getData, getDefault, postData, postManyData, deleteData } from '../service/DataService.js';

const router = express.Router();

router.get('/', getDefault);
router.get('/api/data', getData);

router.post('/api/data', postData);
router.post("/api/manydata", postManyData);

router.delete("/api/cleardata", deleteData);//Không nghịch cái này 

export default router;