import "dotenv/config";
import mqtt from "mqtt";
import io from "./io.config.js";
import { handleTranferDate } from "../service/DataService.js";
import models from "../db/index.js";
import influxClient from "./influxdb.js";
import writePoint from "../service/influxService.js";

const [Data, point] = [models.Data, models.point];

const mqttClient = mqtt.connect(
  `mqtts://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`,
  {
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASS,
    rejectUnauthorized: false,
  }
);

mqttClient.on("connect", () => {
  console.log("Connected to HiveMQ Cloud");
  mqttClient.subscribe(process.env.MQTT_TOPIC);
});

mqttClient.on("error", (err) => {
  console.error("Lỗi kết nối MQTT:", err);
});

// TOPIC CẢNH BÁO
const ALERT_TOPIC = "home/alert";

mqttClient.on("message", async (topic, message) => {
  try {
    const rawMsg = message.toString();
    const jsonData = JSON.parse(rawMsg);

    let isAlert = false;
    let reasons = [];

    if (jsonData.temp !== undefined && jsonData.temp > 26) {
      isAlert = true;
      reasons.push(`Nhiệt độ cao (${jsonData.temp})`);
    }

    if (jsonData.humi !== undefined && jsonData.humi < 45) {
      isAlert = true;
      reasons.push(`Độ ẩm thấp (${jsonData.humi})`);
    }

    if (jsonData.light !== undefined && jsonData.light < 600) {
      isAlert = true;
      reasons.push(`Ánh sáng yếu (${jsonData.light})`);
    }

    if (isAlert) {
      console.log(`⚠️ CẢNH BÁO: ${reasons.join(", ")} -> Gửi lệnh ON`);
      mqttClient.publish(ALERT_TOPIC, "ON");
    } else {
      mqttClient.publish(ALERT_TOPIC, "OFF");
    }
    const now = new Date().toISOString();
    const timeObj = handleTranferDate(now);

    const newData = await Data.create({
      time: timeObj,
      temp: jsonData.temp,
      humi: jsonData.humi,
      light: jsonData.light,
    });
    console.log(" Đã lưu MongoDB:", newData);

    try {
      writePoint(influxClient, jsonData);
      console.log(" Đã lưu InfluxDB:", jsonData);
    } catch (error) {
      console.error(" Lỗi lưu InfluxDB:", error.message);
    }

    io.emit("new_data", newData);
  } catch (err) {
    console.error(" Lỗi xử lý tin nhắn MQTT:", err.message);
  }
});

export default mqttClient;
