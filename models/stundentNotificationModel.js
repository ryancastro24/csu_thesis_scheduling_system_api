import mongoose from "mongoose";

const studentNotificationSchema = mongoose.Schema(
  {
    status: {
      type: String, // Format: YYYY-MM-DD
      required: true,
    },
    remarks: {
      type: String, // Example: "10:00 AM - 12:00 PM"
    },

    type: {
      type: String,
    },

    read: {
      type: Boolean,
      default: false,
    },
    student1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Reference to the College collection
    },
    student2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Reference to the College collection
    },
    student3: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Reference to the College collection
    },

    thesisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "thesisDocument", // Reference to the College collection
    },

    adviserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Reference to the College collection
    },

    coadviserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Reference to the College collection
    },
  },
  {
    timestamps: true,
  },
);

export default mongoose.model(
  "studentnotifications",
  studentNotificationSchema,
);
