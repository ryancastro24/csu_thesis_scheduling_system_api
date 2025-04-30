import mongoose from "mongoose";

const thesisDocumentsSchema = new mongoose.Schema(
  {
    thesisTitle: {
      type: String,
    },

    ratingCount: {
      type: Number,
      default: 0,
    },

    venue: {
      type: String,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users", // Reference to users (students)
      },
    ],
    adviser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Reference to users (advisers)
    },

    panels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users", // Reference to users (panel members)
      },
    ],
    panelApprovals: [
      {
        panel: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users", // Panel member ID
        },
        status: {
          type: String,
          enum: ["pending", "approve", "reject"],
          default: "pending",
        },
        remarks: {
          type: String,
        },
      },
    ],
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    type: {
      type: String,
      enum: ["proposal", "final"],
    },
    documentLink: {
      type: String, // Store file path or URL
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "schedules", // Reference to schedules collection
    },
    reschedule: {
      type: Boolean,
      default: false, // Default value set to false
    },

    defended: {
      type: Boolean,
      default: false, // Default value set to false
    },
    forSchedule: {
      type: Boolean,
      default: false,
    },

    forScheduleStatus: {
      type: String,
      default: "idle",
    },
    approvalFile: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to update status based on panel approvals
thesisDocumentsSchema.pre("save", function (next) {
  if (this.panelApprovals.length > 0) {
    const allApproved = this.panelApprovals.every(
      (approval) => approval.status === "approved"
    );
    const anyRejected = this.panelApprovals.some(
      (approval) => approval.status === "rejected"
    );
  }
  next();
});

export default mongoose.model("thesisDocument", thesisDocumentsSchema);
