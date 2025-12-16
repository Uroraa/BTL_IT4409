import models from "../db/index.js";
import io from '../config/io.config.js';

const Data = models.Data;

const handleTranferDate = (isoTimeString) => {
    const dateObject = new Date(isoTimeString);
    return {
        hour: dateObject.getHours(),
        minute: dateObject.getMinutes(),
        second: dateObject.getSeconds(),
        day: dateObject.getDate(),
        month: dateObject.getMonth() + 1,
        year: dateObject.getFullYear(),
    };
};
const getDefault = (req, res) => {
    res.send("Server is running");
}

const getData = async (req, res) => {
    try {
        // Lấy 50 dòng mới nhất để load trang cho nhanh, thay vì lấy all
        const data = await Data.find({}).sort({ _id: -1 }).limit(10);
        data.reverse();
        res.status(200).json({
            message: "Lấy dữ liệu thành công.",
            data: data,
        });
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
        res.status(400).json({ Error: error.message });
    }
}

const postData = async (req, res) => {
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
}
const postManyData = async (req, res) => {
    try {
        const isoTimeString = req.body.time || new Date().toISOString();
        const time = handleTranferDate(isoTimeString);
        const { temp, humi, light } = req.body;
        const newData = await Data.create({ time, temp, humi, light });
        res.status(200).json({
            message: "Gửi dữ liệu thành công",
            data: newData,
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
}
//Ham xoa du lieu không nghịch
const deleteData = async (req, res) => {
    const limit = parseInt(req.params.limit);
    if (limit <= 0) {
        console.log("Số lượng giới hạn phải lớn hơn 0.");
        return 0;
    }

    try {
        // BƯỚC 1: TÌM KIẾM CÁC ID CỦA NGƯỜI DÙNG MỚI NHẤT
        const latestUsers = await Data.find({})
            .sort({ _id: -1 })  // Sắp xếp giảm dần theo ID (mới nhất lên đầu)
            .limit(limit)       // Giới hạn số lượng N
            .select('_id')      // Chỉ lấy trường _id để tiết kiệm tài nguyên
            .lean();            // Chuyển sang đối tượng JavaScript thuần (tùy chọn, tối ưu hiệu suất)

        // Tạo một mảng chứa các ID cần xóa
        const userIdsToDelete = latestUsers.map(user => user._id);

        if (userIdsToDelete.length === 0) {
            console.log("Không tìm thấy người dùng nào để xóa.");
            return 0;
        }

        const result = await Data.deleteMany({
            _id: { $in: userIdsToDelete }
        });

        // Trả về số lượng đã xóa
        return res.status(200).json("Xoa thanh cong");

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

export {
    handleTranferDate,
    getDefault,
    getData,
    postData,
    postManyData,
    deleteData
}