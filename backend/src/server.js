// require('dotenv').config();

// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");

// const app = express();

// app.use(cors());
// app.use(express.json());

// //Add Schema
// const DataSchema = new mongoose.Schema({
//     time: {
//     },
//     temp: {
//         type: Number
//     },
//     humi: {
//         type: Number
//     },
//     light: {
//         type: Number
//     }
// })
// const Data = mongoose.model("data", DataSchema)

// mongoose.connect(`mongodb+srv://${process.env.USER_NAME}:${process.env.PASS}@db.prvoyfh.mongodb.net/it4409`)
//     .then(() => console.log("Connected to MongoDB"))
//     .catch((err) => console.error("MOnggoDBError", err));

// app.get("/", (req, res) => {
//     res.send("Server đang hoạt động!")
// })

// app.get("/api/data", async (req, res) => {
//     try {
//         const data = await Data.find({});

//         res.status(200).json({
//             message: "Lấy tất cả dữ liệu thành công.",
//             data: data
//         });
//     } catch (error) {
//         res.status(400).json({ Error: error.message })
//     }
// })
// //transfer Date to Object
// const handleTranferDate = (isoTimeString) => {
//     const dateObject = new Date(isoTimeString);
//     return {
//         hour: dateObject.getHours(),
//         minute: dateObject.getMinutes(),
//         day: dateObject.getDate(),
//         //+1 vi getMoth() bat dau tu 0
//         month: dateObject.getMonth() + 1,
//         year: dateObject.getFullYear()
//     }
// };

// app.post("/api/data", async (req, res) => {
//     try {
//         const isoTimeString = req.body.time;
//         const time = handleTranferDate(isoTimeString);
//         const { temp, humi, light } = req.body;
//         const newData = await Data.create({ time, temp, humi, light });
//         res.status(200).json({
//             message: "Gưi dữ liệu thành công",
//             data: newData
//         })
//     } catch (err) {
//         res.status(400).json({ error: err.message });
//     }
// })

// app.post("/api/manydata", async (req, res) => {
//     try {
//         const sampleData = req.body;
//         const createData = sampleData.map(minidata => {
//             const time = handleTranferDate(minidata.time)
//             const { temp, humi, light } = minidata;
//             return Data.create({ time, temp, humi, light });
//         })
//         const newData = await Promise.all(createData);
//         res.status(200).json({
//             message: "Them du lieu thanh cong",
//             data: newData
//         })
//     } catch (error) {
//         res.status(400).json({ Error: error.message })
//     }
// })

// //Run server
// const port = process.env.PORT || 6969;
// app.listen(port, () => {
//     console.log("Server is running on http://localhost:" + port)
// })

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mqtt = require("mqtt");
const connectDB = require('./config/db.config');
const db = require('./db');
const mqttClient = require("./config/mqtt.config");

const app = express();
app.use(cors());
app.use(express.json());
connectDB();// Ket noi mongoDB


// --- CẤU HÌNH SERVER & SOCKET.IO ---
// Dùng http.createServer để chạy chung cả Express và Socket.io trên 1 port
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Cho phép mọi frontend kết nối
    methods: ["GET", "POST"],
  },
});

const Data = db.Data;



// --- HÀM XỬ LÝ THỜI GIAN ---
const handleTranferDate = (isoTimeString) => {
  const dateObject = new Date(isoTimeString);
  return {
    hour: dateObject.getHours(),
    minute: dateObject.getMinutes(),
    day: dateObject.getDate(),
    month: dateObject.getMonth() + 1,
    year: dateObject.getFullYear(),
  };
};


mqttClient.on("message", async (topic, message) => {
  try {
    const rawMsg = message.toString();
    // console.log(`📥 Nhận MQTT: ${rawMsg}`); // Debug

    const jsonData = JSON.parse(rawMsg);

    // 1. Chuẩn bị dữ liệu để lưu
    // Lấy giờ hiện tại của Server làm thời gian nhận
    const now = new Date().toISOString();
    const timeObj = handleTranferDate(now);

    // 2. Lưu vào MongoDB
    const newData = await Data.create({
      time: timeObj,
      temp: jsonData.temp,
      humi: jsonData.hum, // Map 'hum' -> 'humi'
      light: jsonData.light,
    });

    console.log("💾 Đã lưu DB & Emit Socket:", jsonData);

    // 3. Gửi xuống Frontend qua Socket.io (Real-time)
    io.emit("new_data", newData);
  } catch (err) {
    console.error("❌ Lỗi xử lý tin nhắn MQTT:", err.message);
  }
});

// --- CÁC API HTTP  ---

app.get("/", (req, res) => {
  res.send("Server đang hoạt động!");
});

app.get("/api/data", async (req, res) => {
  try {
    // Lấy 50 dòng mới nhất để load trang cho nhanh, thay vì lấy all
    const data = await Data.find({}).sort({ _id: -1 }).limit(50);
    res.status(200).json({
      message: "Lấy dữ liệu thành công.",
      data: data,
    });
  } catch (error) {
    res.status(400).json({ Error: error.message });
  }
});

app.post("/api/data", async (req, res) => {
  try {
    const isoTimeString = req.body.time || new Date().toISOString();
    const time = handleTranferDate(isoTimeString);
    const { temp, humi, light } = req.body;
    const newData = await Data.create({ time, temp, humi, light });

    // Cũng bắn socket khi thêm qua API
    io.emit("new_data", newData);

    res.status(200).json({
      message: "Gửi dữ liệu thành công",
      data: newData,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/api/manydata", async (req, res) => {
  try {
    const sampleData = req.body;
    const createData = sampleData.map((minidata) => {
      const time = handleTranferDate(minidata.time);
      const { temp, humi, light } = minidata;
      return Data.create({ time, temp, humi, light });
    });
    const newData = await Promise.all(createData);
    res.status(200).json({
      message: "Thêm nhiều dữ liệu thành công",
      data: newData,
    });
  } catch (error) {
    res.status(400).json({ Error: error.message });
  }
});

// --- SOCKET.IO EVENTS ---
io.on("connection", (socket) => {
  console.log("👤 Frontend đã kết nối:", socket.id);
  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// --- CHẠY SERVER ---
const port = process.env.PORT || 6969;
// Dùng server.listen thay vì app.listen
server.listen(port, () => {
  console.log("Server is running on http://localhost:" + port);
});
