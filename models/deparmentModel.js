import mongoose from "mongoose";

const departmenSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    acronym: {
      type: String,
      required: true,
      unique: true,
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "colleges", // Reference to the Department collection
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("departments", departmenSchema);
