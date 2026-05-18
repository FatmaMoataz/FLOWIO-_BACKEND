import { Server} from "socket.io";
import http from "http";

// عمل سيرفر HTTP عادي جداً
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Flowio Socket Server is Running!\n");
});

// ربط السوكيت بالسيرفر وتفعيل الـ CORS عشان الفرونت إند يعرف يكلمه
const io = new Server(server, {
  cors: {
    origin: "*", // أو حطي لينك الفرونت إند بتاعك لزيادة الأمان
    methods: ["GET", "POST"]
  }
});

// الـ Logic بتاع الشات بتاعك زي ما هو
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("join_room", (roomName) => {
    socket.join(roomName);
    console.log(`User joined room: ${roomName}`);
  });

  socket.on("send_message", (data) => {
    // هيبعت الرسالة لكل اللي في الأوضة في نفس اللحظة
    io.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// السيرفر هيشتغل على بورت 10000 (وده البورت الافتراضي في ريندر)
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});