import mongoose from "mongoose";
const DataSchema = new mongoose.Schema({
  time: {
    hour: Number,
    minute: Number,
    second: Number,
    day: Number,
    month: Number,
    year: Number,
  },
  temp: { type: Number },
  humi: { type: Number },
  light: { type: Number },
}, { timestamps: true });

const Data = mongoose.model("data", DataSchema);

export default Data;
