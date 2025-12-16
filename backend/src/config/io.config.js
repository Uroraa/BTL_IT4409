import { server } from './server.config.js';
import { Server } from 'socket.io';

const io = new Server(server, {
    cors: {
        origin: "*", // Cho phép mọi frontend kết nối
        methods: ["GET", "POST"],
    },
});
io.on("connection", (socket) => {
    console.log("👤 Frontend đã kết nối:", socket.id);
    socket.on("disconnect", () => {
        console.log("User disconnected");
    });
});

export default io;