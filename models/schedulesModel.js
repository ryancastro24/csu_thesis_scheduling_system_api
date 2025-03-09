import mongoose from "mongoose";

const schedulesSchema = mongoose.Schema(
  {
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
    },
    time: {
      type: String, // Example: "10:00 AM - 12:00 PM"
      required: true,
    },

    eventType: {
      type: String,
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Reference to the College collection
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("schedules", schedulesSchema);
