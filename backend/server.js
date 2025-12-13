require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");


const app = express();

app.use(cors);
app.use(express.json());



mongoose.connect(`mongodb+srv://${process.env.USER_NAME}:${process.env.PASS}@db.prvoyfh.mongodb.net/?appName=db`)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MOnggoDBError", err));



app.get("/", (req, res) => {
    res.send("Server đang hoạt động!")
})

const port = process.env.PORT || 6969;

app.listen(port, () => {
    console.log("Server is running on http://localhost:" + port)
})
