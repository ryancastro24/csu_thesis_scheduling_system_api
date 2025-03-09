import { Router } from "express";
import {
  getAllSchedules,
  createSchedule,
} from "../controller/schedulesController.js";
const router = Router();

router.route("/").get(getAllSchedules).post(createSchedule);
export default router;
