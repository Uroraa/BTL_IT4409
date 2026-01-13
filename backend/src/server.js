import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.config.js';
import mqttClient from './config/mqtt.config.js';
import influxClient from "./config/influxdb.js";
import { app, server } from './config/server.config.js';
import router from './routes/web.js';
import { postSampleData } from "./service/GrafanaService.js";

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use('/', router);
// postSampleData();


//CHẠY SERVER
const port = process.env.PORT || 6969;
server.listen(port, '0.0.0.0', () => {
  console.log("Server is running on http://localhost:" + port);
});
