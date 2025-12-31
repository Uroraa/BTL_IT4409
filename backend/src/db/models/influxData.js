import { Point } from '@influxdata/influxdb3-client';
const database = "data"
const point = new Point('Data')

export {
    point,
    database
}
