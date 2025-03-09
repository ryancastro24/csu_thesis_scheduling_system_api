import mongoose from "mongoose";

const thesisDocumentsSchema = new mongoose.Schema(
  {
    thesisTitle: {
      type: String,
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users", // Reference to users (students)
        required: true,
      },
    ],
    advisers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users", // Reference to users (advisers)
        required: true,
      },
    ],
    panels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users", // Reference to users (panel members)
        required: true,
      },
    ],
    panelApprovals: [
      {
        panel: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users", // Panel member ID
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        reamarks: {
          type: String,
          default: "pending",
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
      required: true,
    },
    document: {
      type: String, // Store file path or URL
    },
    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "schedules", // Reference to schedules collection
      required: true,
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

    if (allApproved) {
      this.status = "approved";
    } else if (anyRejected) {
      this.status = "rejected";
    } else {
      this.status = "pending";
    }
  }
  next();
});

export default mongoose.model("thesisDocument", thesisDocumentsSchema);
