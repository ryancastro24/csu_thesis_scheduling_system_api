import mongoose from "mongoose";

const adviserAcceptanceSchema = mongoose.Schema(
  {
    student1Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Reference to the College collection
      
    },

    student2Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Reference to the College collection
      
    },
    student3Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Reference to the College collection
      
    },
    adviserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Reference to the College collection
      required: true,
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
