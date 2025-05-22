const express = require("express");
const http = require("http");
const { Server } = require("socket.io")

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});

// Used to store online users: { userId: socketId }
const userSocketMap = {};



function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}




io.on("connection", (socket) => {
  console.log("🔌 A user connected:", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) {
    userSocketMap[userId] = socket.id;

    // Emit updated online users list to all clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  socket.on("disconnect", () => {
    console.log("❌ A user disconnected:", socket.id);

    // Remove user from map only if they were mapped
    for (const id in userSocketMap) {
      if (userSocketMap[id] === socket.id) {
        delete userSocketMap[id];
        break;
      }
    }

    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

module.exports={ io, app, server,getReceiverSocketId };
