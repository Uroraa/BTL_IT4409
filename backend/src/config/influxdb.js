import 'dotenv/config.js'
import { InfluxDBClient, Point } from '@influxdata/influxdb3-client'

const influxClient = new InfluxDBClient({ host: process.env.INFLUXDB_HOST, token: process.env.INFLUXDB_TOKEN })
console.log("Connected to influxDB");

export default influxClient;