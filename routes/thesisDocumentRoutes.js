import { Router } from "express";

import {
  getAllThesis,
  createThesisDocument,
  getThesisByPanel,
  updatePanelApproval,
  deleteCase,
  getAllPendingThesis,
  getApprovedThesisByPanel,
  getUserThesisModel,
  updateThesisSchedule,
  updateThesisScheduleApproval,
  getThesisByAdviser,
  updateThesisToDefended,
  getThesisDocumentById,
  getUserFinalThesisModel,
  createFinalThesisDocument,
  getFinalAllThesisDocument,
  getAllThesisDocument,
} from "../controller/thesisDocumentController.js";

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

router.route("/").get(getAllPendingThesis);
router.get("/specificThesisModel/data/:panelId", getThesisByPanel);
router.get(
  "/specificApprovedThesisModel/data/:panelId",
  getApprovedThesisByPanel,
);

router.get("/getAllApprovedThesis/data", getAllThesis);
router.get("/getUserThesisModelData/data/:id", getUserThesisModel);
router.get("/getUserFinalThesisModelData/data/:id", getUserFinalThesisModel);
router.delete("/:id", deleteCase);
router.put("/rescheduleThesisSchedule/thesis/:id", updateThesisSchedule);
router.put(
  "/updateThesisScheduleApprovalData/thesis/:id",
  updateThesisScheduleApproval,
);
router.put("/thesis/:thesisId/panelApproval/:panelId", updatePanelApproval);
router.post(
  "/thesisDocumentData/data",
  upload.fields([
    { name: "thesisFile", maxCount: 1 },
    { name: "approvalFile", maxCount: 1 },
  ]),
  createThesisDocument,
);

router.post(
  "/thesisFinalDocumentData/data",
  upload.fields([
    { name: "thesisFile", maxCount: 1 },
    { name: "approvalFile", maxCount: 1 },
  ]),
  createFinalThesisDocument,
);

router.get("/getThesisByAdviserData/data/:adviserId", getThesisByAdviser);
router.put("/thesisModel/:id/defended", updateThesisToDefended);
router.get("/getThesisDocument/data/:id", getThesisDocumentById);

router.get("/getAllFinalizaedThesis/data", getFinalAllThesisDocument);
router.get("/getAllThesisData/data", getAllThesisDocument);
export default router;
