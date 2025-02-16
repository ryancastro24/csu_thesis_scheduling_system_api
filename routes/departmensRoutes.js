import { Router } from "express";
import {
  getDepartments,
  addDepartment,
} from "../controller/departmentsController.js";
const router = Router();

router.route("/").get(getDepartments).post(addDepartment);

export default router;
