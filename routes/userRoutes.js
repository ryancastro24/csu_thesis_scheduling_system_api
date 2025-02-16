import { Router } from "express";
import {
  getUsers,
  addUser,
  deleteUser,
  updateUser,
} from "../controller/userController.js";
const router = Router();

router.route("/").get(getUsers).post(addUser);
router.route("/:id").delete(deleteUser).put(updateUser);
export default router;
