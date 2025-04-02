import { Router } from "express";
import {
  getUsers,
  addUser,
  deleteUser,
  updateUser,
  getStudents,
  getfaculty,
  getChairpersons,
} from "../controller/userController.js";
const router = Router();

router.route("/").get(getUsers).post(addUser);
router.route("/:id").delete(deleteUser).put(updateUser);
router.get("/students/data", getStudents);
router.get("/faculty/data", getfaculty);
router.get("/chairpersons/data", getChairpersons);
export default router;
