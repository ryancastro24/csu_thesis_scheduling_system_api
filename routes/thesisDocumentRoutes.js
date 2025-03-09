import { Router } from "express";

import {
  getAllThesis,
  createThesisDocument,
} from "../controller/thesisDocumentController.js";
const router = Router();

router.route("/").get(getAllThesis).post(createThesisDocument);

export default router;
