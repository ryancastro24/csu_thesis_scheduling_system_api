import { Router } from "express";
import {
  getStudentNotifications,
  markReadAllNotifications,
} from "../controller/studentNotificationController.js";
const router = Router();

router
  .get("/:studentId", getStudentNotifications)
  .put("/:studentId", markReadAllNotifications);

export default router;
