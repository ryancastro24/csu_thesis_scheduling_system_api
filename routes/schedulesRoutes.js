import { Router } from "express";
import {
  getAllSchedules,
  createSchedule,
  getUsersSchedules,
  generateSchedule,
  deleteUserSchedule,
} from "../controller/schedulesController.js";
const router = Router();

router.route("/").get(getAllSchedules).post(createSchedule);
router.post("/generateThesisSchedule/data", generateSchedule);
router.get("/:id", getUsersSchedules).delete("/:id", deleteUserSchedule);
export default router;
