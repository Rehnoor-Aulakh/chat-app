import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// Create Express app using HTTP server
const app = express();
const server = http.createServer(app);

// Define custom CORS middleware to allow all origins + headers
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://chat-arsj7f3bo-rehnoor-aulakhs-projects.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "token"], // <-- allow 'token' header
    credentials: true,
  })
);
app.options("*", cors(corsOptions)); // Handle preflight manually (optional)

// Parse JSON payloads
app.use(express.json({ limit: "10mb" }));

// Initialize socket.io server
export const io = new Server(server, {
  cors: {
    origin: true, // Reflects the request origin
    credentials: true,
  },
});

// Online users map
export const userSocketMap = {};

// Socket.io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected", userId);

  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User disconnected", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Middleware to ensure DB connection for each request
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

// Routes
app.use("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Start server locally (non-production)
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
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
  }
};

// Handle serverless behavior (Vercel)
if (process.env.NODE_ENV === "production") {
  connectDB().catch(console.error);
} else {
  startServer();
}

// Export server for Vercel
export default server;
