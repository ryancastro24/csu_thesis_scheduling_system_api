import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MONGO CONNECTED ${conn.connection.host}`.cyan.underline);
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};
