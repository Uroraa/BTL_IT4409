# BTL_IT4409 - Hệ thống IoT Giám sát Sensor

## Mô tả dự án

Dự án này là hệ thống IoT giám sát môi trường sử dụng sensor để thu thập dữ liệu nhiệt độ, độ ẩm và ánh sáng. Dữ liệu được gửi qua giao thức MQTT, lưu trữ trong MongoDB và hiển thị real-time trên giao diện web.

### Tính năng chính
- Thu thập dữ liệu từ sensor Arduino qua MQTT
- Lưu trữ dữ liệu trong MongoDB Atlas
- API RESTful cho CRUD operations
- Hiển thị dữ liệu real-time với Socket.io
- Giao diện web với biểu đồ (React + Recharts)
- Simulator Python để mô phỏng dữ liệu sensor

## Công nghệ sử dụng

### Backend
- **Node.js** với **Express.js** - Framework web
- **MongoDB** với **Mongoose** - Cơ sở dữ liệu
- **MQTT** - Giao thức IoT
- **Socket.io** - Real-time communication
- **CORS** - Cross-origin resource sharing

### Frontend
- **React** - Library UI
- **Vite** - Build tool
- **Axios** - HTTP client
- **Recharts** - Thư viện biểu đồ

### IoT & Simulation
- **Arduino** (ESP8266) - Hardware sensor
- **Python** - Simulator dữ liệu


## Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js >= 16
- Python >= 3.8 (cho simulator)
- Arduino IDE (cho sensor)

### 1. Clone repository
```bash
git clone <repository-url>
cd BTL_IT4409
```

### 2. Cài đặt dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

#### Simulator (tùy chọn)
```bash
cd simulator
pip install -r requirements.txt
```

### 3. Chạy ứng dụng

1. Khởi động backend và frontend
#### Backend
```bash
cd backend
npm start
```
Server sẽ chạy trên `http://localhost:3001` (`http://localhost:6969` nếu cổng 3001 đang bận )

#### Frontend
```bash
cd frontend
npm run dev
```
Frontend sẽ chạy trên `http://localhost:5173` (mặc định Vite)
--
#### Simulator (tùy chọn)
```bash
cd simulator
python simulator.py
```

2. Mở browser truy cập `http://localhost:5173`
3. Dữ liệu sẽ hiển thị real-time khi sensor gửi qua MQTT
4. Sử dụng Postman để test API CRUD
