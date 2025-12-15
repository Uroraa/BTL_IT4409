const mongoose = require("mongoose");
const DataSchema = new mongoose.Schema({
    time: {
        hour: Number,
        minute: Number,
        day: Number,
        month: Number,
        year: Number,
    },
    temp: { type: Number },
    humi: { type: Number }, // ESP gửi lên đang là 'hum', khi lưu vào mongodb đã map hum =>humi
    light: { type: Number },
});

module.exports = mongoose.model('data', DataSchema);