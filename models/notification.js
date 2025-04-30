import mongoose from "mongoose";

const notificationSchema = mongoose.Schema(
  {
    status: {
      type: String, // Format: YYYY-MM-DD
      required: true,
    },
    remarks: {
      type: String, // Example: "10:00 AM - 12:00 PM"
      required: true,
    },

    read: {
      type: Boolean,
      default: false,
    },

    thesisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "thesisDocument", // Reference to the College collection
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

export default mongoose.model("notifications", notificationSchema);
