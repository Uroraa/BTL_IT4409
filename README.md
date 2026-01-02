# BTL_IT4409 - Hệ thống IoT Giám sát Sensor

## Mô tả dự án

Dự án này là hệ thống IoT giám sát môi trường sử dụng sensor để thu thập dữ liệu nhiệt độ, độ ẩm và ánh sáng. Dữ liệu được gửi qua giao thức MQTT, lưu trữ trong MongoDB và InfluxDB, hiển thị real-time trên giao diện web và dashboard Grafana.

### Tính năng chính
- Thu thập dữ liệu từ sensor Arduino qua MQTT
- Lưu trữ dữ liệu trong MongoDB (dữ liệu chính) và InfluxDB (time-series cho analytics)
- API RESTful cho CRUD operations
- Hiển thị dữ liệu real-time với Socket.io
- Giao diện web với biểu đồ (React + Recharts)
- Dashboard Grafana cho visualization nâng cao
- Simulator Python để mô phỏng dữ liệu sensor
- Hệ thống cảnh báo tự động dựa trên ngưỡng

## Công nghệ sử dụng

### Backend
- **Node.js** với **Express.js** - Framework web
- **MongoDB** với **Mongoose** - Cơ sở dữ liệu chính
- **InfluxDB** - Time-series database cho analytics
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

### Monitoring & Visualization
- **Grafana** - Dashboard và visualization
- **Docker** - Containerization cho Grafana


## Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js >= 16
- Python >= 3.8 (cho simulator)
- Arduino IDE (cho sensor)
- Docker (cho Grafana)

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

#### Simulator
```bash
cd simulator
pip install -r requirements.txt
```

#### Grafana 
```bash
cd grafana
docker-compose up -d
```

### 3. Cấu hình môi trường

Tạo file `.env` trong thư mục `backend` với các biến môi trường cần thiết:
```env
MONGODB_URI=mongodb://localhost:27017/sensor_db
MQTT_BROKER=mqtt://localhost:1883
INFLUXDB_URL=https://your-influxdb-url
INFLUXDB_TOKEN=your-token
INFLUXDB_ORG=your-org
INFLUXDB_BUCKET=your-bucket
```

### 4. Chạy ứng dụng

#### Backend
```bash
cd backend
npm start
```
Server sẽ chạy trên `http://localhost:6969`

#### Frontend
```bash
cd frontend
npm run dev
```
Frontend sẽ chạy trên `http://localhost:5173`

#### Simulator (tùy chọn)
```bash
cd simulator
python simulator.py
```

#### Grafana Dashboard
Grafana sẽ chạy trên `http://localhost:3001`

### 5. Sử dụng

1. Mở browser truy cập `http://localhost:5173` để xem dashboard chính
2. Truy cập `http://localhost:3001` trên trình duyệt để xem Grafana dashboard (tài khoản: admin. Mật khẩu: 1234)
3. Dữ liệu sẽ hiển thị real-time khi sensor gửi qua MQTT
4. Sử dụng Postman hoặc curl để test API endpoints

### API Endpoints

- `GET /` - Health check
- `GET /api/data` - Lấy dữ liệu sensor (50 bản ghi mới nhất)
- `POST /api/data` - Thêm dữ liệu sensor mới
- `GET /api/history?sensor=temp&count=10` - Lịch sử dữ liệu theo sensor
- `GET /api/alerts?count=10` - Danh sách cảnh báo


## Troubleshooting

### Lỗi kết nối MongoDB
- Kiểm tra MongoDB đang chạy: `mongod --version`
- Kiểm tra connection string trong `.env`

### Lỗi MQTT
- Đảm bảo MQTT broker đang chạy (mosquitto)
- Kiểm tra địa chỉ broker trong config

### Lỗi InfluxDB
- Kiểm tra credentials và URL trong `.env`
- Đảm bảo bucket và org tồn tại

### Frontend không load được
- Kiểm tra backend đang chạy trên port 6969
- Kiểm tra CORS settings

