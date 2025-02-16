import mongoose from "mongoose";

const collegeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },

    acronyms: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("colleges", collegeSchema);
