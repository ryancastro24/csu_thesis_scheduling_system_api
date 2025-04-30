import { Router } from "express";

import {
  getNotifications,
  addNotification,
  getNotificationsReaded,
  updateNotification,
} from "../controller/notificationController.js";
const router = Router();

router.get("/", getNotifications).post("/", addNotification);
router.get("/readed", getNotificationsReaded);
router.put("/:id", updateNotification);
export default router;
