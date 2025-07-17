// Middleware to protect routes

import User from "../models/User.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (req, res, next) => {
  try {
    // get the fucking token from the header
    const token = req.headers.token;
    const decoded = jwt.decode(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      res.status(401).json({
        status: "failed",
        message: "User not found!",
      });
    }
    req.user = user;
    next();
  } catch (error) {
    console.log(error.message);
    res.status(400).json({
      status: "failed",
      message: error.message,
    });
  }
};
