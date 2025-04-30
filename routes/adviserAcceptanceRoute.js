import { Router } from "express";
import {
  addAdviserApproval,
  getUserAdviserAcceptanceRequest,
  getAdviserAcceptanceRequest,
  approvedProposal,
} from "../controller/advicerAcceptanceController.js";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET, // Replace with your Cloudinary API secret
});

// Multer-Cloudinary storage setup with upload preset
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads", // Folder name in Cloudinary
    format: async (req, file) => {
      // Dynamically get file extension
      const fileExtension = file.mimetype.split("/")[1]; // e.g., 'jpeg', 'png', 'pdf'
      return fileExtension;
    },
    public_id: (req, file) => Date.now() + "-" + file.originalname, // Generate unique filename
    // Use upload preset
    resource_type: "auto", // Automatically determine resource type
    upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET, // Add your upload preset here
  },
});

const upload = multer({ storage });
const router = Router();

router.post("/", upload.single("file"), addAdviserApproval);
router.get("/:id", getUserAdviserAcceptanceRequest);
router.get("/adviserApporvals/:id", getAdviserAcceptanceRequest);
router.put("/approveProposal/:id", approvedProposal);
export default router;
