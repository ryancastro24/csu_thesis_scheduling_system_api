import { Router } from "express";
import { getColleges, addCollege } from "../controller/collegesController.js";
const router = Router();

router.route("/").get(getColleges).post(addCollege);

export default router;
