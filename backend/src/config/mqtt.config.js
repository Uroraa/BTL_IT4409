require('dotenv').config();
const mqtt = require("mqtt");

const mqttClient = mqtt.connect(`mqtts://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`, {
    username: process.env.MQTT_USER,
    password: process.env.MQTT_PASS,
    rejectUnauthorized: false, // Bỏ qua lỗi chứng chỉ SSL
})

mqttClient.on("connect", () => {
    console.log("Connected to HiveMQ Cloud");
    mqttClient.subscribe(process.env.MQTT_TOPIC);
});

mqttClient.on('error', (err) => {
    // Xử lý lỗi kết nối
    console.error('Lỗi kết nối MQTT:', err);
});

module.exports = mqttClient;