import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb+srv://galleros_IMS:LhaQeT7jxn9Pr9qT@cluster0.fb0ht0l.mongodb.net/?appName=Cluster0";
    const conn = await mongoose.connect(mongoUri);
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Database connection failed:", error.message);
    throw error;
  }
};

export default connectDB;