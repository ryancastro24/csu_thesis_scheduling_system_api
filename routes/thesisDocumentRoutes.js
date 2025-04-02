import { Router } from "express";

import {
  getAllThesis,
  createThesisDocument,
  getThesisByPanel,
  updatePanelApproval,
} from "../controller/thesisDocumentController.js";
const router = Router();

router.route("/").get(getAllThesis).post(createThesisDocument);
router.get("/specificThesisModel/data/:panelId", getThesisByPanel);
router.put("/thesis/:thesisId/panelApproval/:panelId", updatePanelApproval);

export default router;
