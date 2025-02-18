import mongoose from "mongoose";

const scheduleSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    date: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Reference to the Department collection
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("schedules", scheduleSchema);
