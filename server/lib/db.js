import mongoose from "mongoose";

//Function to connect to the MONGODB Database

export const connectDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log("Database already connected");
      return;
    }

    mongoose.connection.on("connected", () => {
      console.log("database connected");
    });

    mongoose.connection.on("error", (err) => {
      console.log("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected");
    });

    await mongoose.connect(`${process.env.MONGODB_URI}/chat-app`, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });

    // Disable mongoose buffering for serverless
    mongoose.set("bufferCommands", false);
  } catch (err) {
    console.log("Database connection error:", err);
    throw err;
  }
};
