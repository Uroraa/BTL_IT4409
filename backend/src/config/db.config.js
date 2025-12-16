import 'dotenv/config'
import mongoose from 'mongoose';

const connectDB = mongoose.connect(`mongodb+srv://${process.env.USER_NAME}:${process.env.PASS}@db.prvoyfh.mongodb.net/it4409`)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("MongoDB Error", err));


export default connectDB;