import mongoose from "mongoose";

//Function to connect to the MONGODB Database

export const connectDB = async () => {
  try {
    mongoose.connection.on("connected", () => {
      console.log("database connected");
    });
    await mongoose.connect(`${process.env.MONGODB_URI}/chat-app`);
  } catch (err) {
    console.log(err);
  }
};
