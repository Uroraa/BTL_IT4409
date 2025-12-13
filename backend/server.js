require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

//Add Schema
const DataSchema = new mongoose.Schema({
    time: {
    },
    temp: {
        type: Number
    },
    humi: {
        type: Number
    },
    light: {
        type: Number
    }
})
const Data = mongoose.model("data", DataSchema)

mongoose.connect(`mongodb+srv://${process.env.USER_NAME}:${process.env.PASS}@db.prvoyfh.mongodb.net/it4409`)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MOnggoDBError", err));



app.get("/", (req, res) => {
    res.send("Server đang hoạt động!")
})

app.get("/api/data", async (req, res) => {
    try {
        const data = await Data.find({});

        res.status(200).json({
            message: "Lấy tất cả dữ liệu thành công.",
            data: data
        });
    } catch (error) {
        res.status(400).json({ Error: error.message })
    }
})
//transfer Date to Object
const handleTranferDate = (isoTimeString) => {
    const dateObject = new Date(isoTimeString);
    return {
        hour: dateObject.getHours(),
        minute: dateObject.getMinutes(),
        day: dateObject.getDate(),
        //+1 vi getMoth() bat dau tu 0
        month: dateObject.getMonth() + 1,
        year: dateObject.getFullYear()
    }
};

app.post("/api/data", async (req, res) => {
    try {
        const isoTimeString = req.body.time;
        const time = handleTranferDate(isoTimeString);
        const { temp, humi, light } = req.body;
        const newData = await Data.create({ time, temp, humi, light });
        res.status(200).json({
            message: "Gưi dữ liệu thành công",
            data: newData
        })
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
})

app.post("/api/manydata", async (req, res) => {
    try {
        const sampleData = req.body;
        const createData = sampleData.map(minidata => {
            const time = handleTranferDate(minidata.time)
            const { temp, humi, light } = minidata;
            return Data.create({ time, temp, humi, light });
        })
        const newData = await Promise.all(createData);
        res.status(200).json({
            message: "Them du lieu thanh cong",
            data: newData
        })
    } catch (error) {
        res.status(400).json({ Error: error.message })
    }
})

//Run server
const port = process.env.PORT || 6969;
app.listen(port, () => {
    console.log("Server is running on http://localhost:" + port)
})
