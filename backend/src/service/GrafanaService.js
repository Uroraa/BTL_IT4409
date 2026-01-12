import models from "../db/index.js";
import writePoint from "./influxService.js";
import influxClient from "../config/influxdb.js";
import { handleTranferDate } from "./DataService.js";

const Data = models.Data;

const handleAlert = (req, res) => {
    console.log("Gói tin đang đến...")
    try {
        const data = req.body;

        // Lấy các thông tin chính
        const status = data.status; // 'firing' hoặc 'resolved'
        const title = data.title;
        const message = data.message;

        console.log("--------------------------------");
        console.log(`TRẠNG THÁI: [${status.toUpperCase()}]`);
        console.log(`TIÊU ĐỀ: ${title}`);
        console.log(`NỘI DUNG: ${message}`);
        console.log("--------------------------------");

        // Phản hồi cho Grafana
        res.status(200).send('Đã nhận dữ liệu');

    } catch (error) {
        console.error("Lỗi khi xử lý cảnh báo từ Grafana:", error);

    }
}

const generateSampleData = () => {
    // const temp = (Math.random() * 30 + 10);
    const rawTime = new Date().toISOString();
    const time = handleTranferDate(rawTime);
    const temp = (Math.random() * 40 + 10);
    const humi = (Math.random() * 67.5 + 10);
    const light = (Math.random() * 90 + 30);
    return { time, temp, humi, light };
}

const postSampleData = async () => {
    try {
        while (true) {
            const sampleData = generateSampleData();
            await Data.create(sampleData);
            // io.emit("new_data", sampleData);
            await writePoint(influxClient, sampleData);
            console.log("Sample data posted to MongoDB and InfluxDB:", sampleData);
            // console.log("Sample data posted to InfluxDB:", sampleData);
            await new Promise(resolve => setTimeout(resolve, 5000)); // Dừng 5s
        }
    } catch (err) {
        console.error("Error in postSampleData:", err);
    }
}

export { handleAlert, postSampleData };