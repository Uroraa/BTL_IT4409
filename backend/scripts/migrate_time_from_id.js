import 'dotenv/config';
import mongoose from 'mongoose';
import Data from '../src/db/models/Data.js';

const mongoUri = process.env.MONGODB_URI
  || `mongodb+srv://${process.env.USER_NAME}:${process.env.PASS}@db.prvoyfh.mongodb.net/it4409`;

const toTimeObj = (date) => ({
  hour: date.getHours(),
  minute: date.getMinutes(),
  second: date.getSeconds(),
  day: date.getDate(),
  month: date.getMonth() + 1,
  year: date.getFullYear(),
});

const hasValidTime = (time) => {
  if (!time || typeof time !== 'object') return false;
  if (!time.year || !time.month || !time.day) return false;
  return true;
};

const run = async () => {
  await mongoose.connect(mongoUri);

  const query = {
    $or: [
      { time: { $exists: false } },
      { 'time.year': { $in: [null, 0, ''] } },
      { 'time.month': { $in: [null, 0, ''] } },
      { 'time.day': { $in: [null, 0, ''] } },
    ],
  };

  const docs = await Data.find(query).lean();
  if (!docs.length) {
    console.log('No documents require migration.');
    await mongoose.disconnect();
    return;
  }

  const ops = [];
  for (const doc of docs) {
    if (hasValidTime(doc.time)) continue;
    const createdAt = doc.createdAt ? new Date(doc.createdAt) : null;
    const fallback = createdAt || (doc._id && doc._id.getTimestamp ? doc._id.getTimestamp() : null);
    if (!fallback) continue;
    ops.push({
      updateOne: {
        filter: { _id: doc._id },
        update: { $set: { time: toTimeObj(fallback) } },
      },
    });
  }

  if (!ops.length) {
    console.log('No updates needed after filtering.');
    await mongoose.disconnect();
    return;
  }

  const res = await Data.bulkWrite(ops);
  console.log(`Updated ${res.modifiedCount} documents.`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error('Migration failed:', err);
  await mongoose.disconnect();
  process.exit(1);
});
