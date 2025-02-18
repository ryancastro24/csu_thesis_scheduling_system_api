import { Router } from "express";
import {
  getUserSchedules,
  addNewSchedules,
  deleteSchedule,
} from "../controller/schedulesController.js";
const router = Router();

router.post("/", addNewSchedules);
router.route("/:id").get(getUserSchedules).delete(deleteSchedule);

export default router;
