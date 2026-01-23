import mongoose from "mongoose";

const usersSchema = mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
    },
    middlename: {
      type: String,
    },
    lastname: {
      type: String,
      required: true,
    },
    suffix: {
      type: String,
    },
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

    userType: {
      type: String,
      required: true,
    },
    approved: {
      type: Boolean,
      default: false,
    },

    email: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
    },
    otp: {
      type: Number,
    },
    otpExpiry: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model("users", usersSchema);
