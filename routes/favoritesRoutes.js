import {
  getAllFavorites,
  createFavorite,
  deleteFavorite,
} from "../controller/favoritesController.js";
import { Router } from "express";

const router = Router();

router.post("/", createFavorite);
router
  .get("/:id", getAllFavorites)
  .delete("/:userId/:thesisId", deleteFavorite);

export default router;
