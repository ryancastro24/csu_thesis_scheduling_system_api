import { Router } from "express";
import { userLogin } from "../controller/authController.js";

const router = Router();

router.post("/login", userLogin);

export default router;
