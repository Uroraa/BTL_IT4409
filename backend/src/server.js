import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.config.js';
import mqttClient from './config/mqtt.config.js';
import influxClient from "./config/influxdb.js";
import { app, server } from './config/server.config.js';
import router from './routes/web.js';

app.use(cors());
app.use(express.json());
app.use('/', router);


//CHẠY SERVER
const port = process.env.PORT || 6969;
server.listen(port, () => {
  console.log("Server is running on http://localhost:" + port);
});
