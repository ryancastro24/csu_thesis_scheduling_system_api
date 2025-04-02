import mongoose from "mongoose";

const favoritesSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // Reference to the College collection
      required: true,
    },
    caseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cases", // Reference to the College collection
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("favorites", favoritesSchema);
