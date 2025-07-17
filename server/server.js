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

// CORS headers middleware for all routes
app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174", 
    "https://chat-app-omega-cyan.vercel.app"
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Middleware to ensure database connection for serverless functions
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

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
      server.listen(PORT, () =>
        console.log("Server is running on PORT: " + PORT)
      );
    }
  } catch (error) {
    console.error("Failed to connect to database:", error);
    // Don't exit process in serverless environment
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
  }
};

// For Vercel serverless functions, we need to ensure DB connection on each request
if (process.env.NODE_ENV === "production") {
  // Connect to DB immediately for serverless
  connectDB().catch(console.error);
} else {
  // For local development, use the startServer function
  startServer();
}

//Export server for vercel
export default server;
