import express from 'express';

const router = express.Router();

const initWebRoute = (app) => {
    router.get('/', (req, res) => {
        res.send("server is running")
    })
    router.get('/api/data', async (req, res) => {
        try {
            // Lấy 10 dòng mới nhất để load trang cho nhanh, thay vì lấy all
            const data = await Data.find({}).sort({ _id: -1 }).limit(10);
            res.status(200).json({
                message: "Lấy dữ liệu thành công.",
                data: data,
            });
        } catch (error) {
            res.status(400).json({ Error: error.message });
        }
    })
}

module.exports = initWebRoute;