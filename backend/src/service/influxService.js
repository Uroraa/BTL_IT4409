import { Point } from '@influxdata/influxdb3-client';
import { database } from '../db/models/influxData.js';
const writePoint = async (influxClient, jsonData) => {
    const point = new Point('data')
        .setField('temp', jsonData.temp)
        .setField('humi', jsonData.humi)
        .setField('light', jsonData.light)
        .setTimestamp(new Date());
    await influxClient.write(point, database);
};

export default writePoint;