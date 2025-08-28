import { Router } from "express";
import {
  getUsers,
  addUser,
  deleteUser,
  updateUser,
  getStudents,
  getfaculty,
  approvedUser,
  updateUserProfile,
  getChairpersons,
  getUserProfile,
  sendOTP,
  verifyOTP,
  changePassword,
  getAllRequestingUsers,
} from "../controller/userController.js";

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

router.route("/").get(getUsers).post(addUser);
router.get("/requestingUsers", getAllRequestingUsers);
router.post("/sendOTP", sendOTP);
router.post("/verifyOTP", verifyOTP);
router.post("/changePassword", changePassword);
router.put("/updateUserProfile/:id", upload.single("file"), updateUserProfile);
router.route("/:id").delete(deleteUser).put(updateUser);
router.put("/approvedUser/:id", approvedUser);
router.get("/students/data", getStudents);
router.get("/faculty/data", getfaculty);
router.get("/getUserProfile/data/:id", getUserProfile);
router.get("/chairpersons/data", getChairpersons);
export default router;
