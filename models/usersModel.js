import mongoose from "mongoose";

const usersSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    id_number: {
      type: String,
      required: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "departments", // Reference to the Department collection
      required: true,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "colleges", // Reference to the Department collection
      required: true,
    },

    userType: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },

    busySchedules: {
      type: [String], // Array of string URLs
      default: [], // Default empty array
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("users", usersSchema);
