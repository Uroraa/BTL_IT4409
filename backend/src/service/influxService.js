import { Point } from '@influxdata/influxdb3-client';
const writePoint = async (influxClient, jsonData) => {
    const point = new Point('DATA')
        .setField('temp', jsonData.temp)
        .setField('humi', jsonData.humi)
        .setField('light', jsonData.light)
        .setTimestamp(new Date());
    await influxClient.write(point, 'data');
};

export default writePoint;