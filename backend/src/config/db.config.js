import 'dotenv/config'
import mongoose from 'mongoose';

const mongoUri = process.env.MONGODB_URI || `mongodb+srv://${process.env.USER_NAME}:${process.env.PASS}@db.prvoyfh.mongodb.net/it4409`;

const connectDB = mongoose.connect(mongoUri)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB Error", err));

export default connectDB;
