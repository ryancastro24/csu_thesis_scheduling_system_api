import mongoose from "mongoose";

const panelApprovalSchema = mongoose.Schema(
  {
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "adviserAcceptances", // Reference to the College collection
      required: true,
    },
    thesisFile: {
      type: String,
    },
    panelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Reference to the College collection
      required: true,
    },
    status: {
      type: String,
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("panelApprovals", panelApprovalSchema);
