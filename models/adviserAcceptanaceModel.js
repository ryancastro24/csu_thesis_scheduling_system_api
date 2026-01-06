import mongoose from "mongoose";

const adviserAcceptanceSchema = new mongoose.Schema(
  {
    student1Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    student2Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    student3Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },

    // The adviser assigned to this acceptance
    adviserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },

    // Optional co-adviser reference (can be in main adviser doc)
    coAdviserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },

    // Role to distinguish between main adviser and co-adviser
    role: {
      type: String,
      enum: ["adviser", "coAdviser"],
      default: "adviser",
    },

    proposeTitle: {
      type: String,
    },

    remarks: {
      type: String,
    },

    thesisFile: {
      type: String,
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

export default mongoose.model("adviserAcceptances", adviserAcceptanceSchema);
