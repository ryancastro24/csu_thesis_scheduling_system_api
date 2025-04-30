import { Router } from "express";
import {
  getAllSchedules,
  createSchedule,
  getUsersSchedules,
  generateSchedule,
  deleteUserSchedule,
  verifyScheduleConflict,
  updateSchedule,
} from "../controller/schedulesController.js";
const router = Router();

router.route("/").get(getAllSchedules).post(createSchedule);
router.post("/generateThesisSchedule/data", generateSchedule);
router.post("/verifyGenerateDateTime/data", verifyScheduleConflict);
router
  .get("/:id", getUsersSchedules)
  .delete("/:id", deleteUserSchedule)
  .put("/:id", updateSchedule);
export default router;
