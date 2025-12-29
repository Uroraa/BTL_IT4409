import "dotenv/config";
import mqtt from "mqtt";
import io from "./io.config.js";
import { handleTranferDate } from "../service/DataService.js";
import models from "../db/index.js";

const Data = models.Data;

const mqttClient = mqtt.connect(
  `mqtts://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`,
  {
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASS,
    rejectUnauthorized: false, // Bỏ qua lỗi chứng chỉ SSL
  }
);

mqttClient.on("connect", () => {
  console.log("Connected to HiveMQ Cloud");
  mqttClient.subscribe(process.env.MQTT_TOPIC);
});

mqttClient.on("error", (err) => {
  // Xử lý lỗi kết nối
  console.error("Lỗi kết nối MQTT:", err);
});

// ĐỊNH NGHĨA TOPIC CẢNH BÁO
const ALERT_TOPIC = "home/alert";

mqttClient.on("message", async (topic, message) => {
  try {
    const rawMsg = message.toString();
    const jsonData = JSON.parse(rawMsg);

    // LOGIC CẢNH BÁO
    // Nếu không có dữ liệu nhiệt độ thì bỏ qua
    if (jsonData.temp !== undefined) {
      if (jsonData.temp > 35) {
        console.log(
          `⚠️ CẢNH BÁO: Nhiệt độ cao (${jsonData.temp}°C) -> Gửi lệnh BẬT LED`
        );
        mqttClient.publish(ALERT_TOPIC, "ON");
      } else {
        mqttClient.publish(ALERT_TOPIC, "OFF");
      }
    }

    // Xử lý thời gian
    const now = new Date().toISOString();
    const timeObj = handleTranferDate(now);

    // Lưu vào DB
    const newData = await Data.create({
      time: timeObj,
      temp: jsonData.temp,
      humi: jsonData.hum,
      light: jsonData.light,
    });

    // Gửi dữ liệu tới Frontend
    io.emit("new_data", newData);

    console.log("💾 Đã lưu DB & Emit Socket:", jsonData);
  } catch (err) {
    console.error("❌ Lỗi xử lý tin nhắn MQTT:", err.message);
  }
});

export default mqttClient;
