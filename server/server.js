import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";
import { log } from "console";

//Create Express app using HTTP server
const app = express();
//socket.io supports this http server
const server = http.createServer(app);

// Initialize socket.io server

export const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://chat-app-omega-cyan.vercel.app",
    ],
    credentials: true,
  },
});

// Store online users

export const userSocketMap = {}; //{userId: socketId}

// Socket.io connection handler

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected ", userId);

  if (userId) userSocketMap[userId] = socket.id;

  //Emit online users to all connected clients

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User disconnected ", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

//creating middlewares
app.use(express.json({ limit: "10mb" }));
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://chat-app-omega-cyan.vercel.app",
    ],
    credentials: true,
  })
);

// Routes setup
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

//connect to mongodb and start server
const startServer = async () => {
  try {
    await connectDB();
    console.log("Database connected");
    
    if (process.env.NODE_ENV !== "production") {
      const PORT = process.env.PORT || 5002;
      server.listen(PORT, () => console.log("Server is running on PORT: " + PORT));
    }
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
};

startServer();

//Export server for vercel
export default server;
