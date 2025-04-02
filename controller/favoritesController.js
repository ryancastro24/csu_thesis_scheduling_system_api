import Favorites from "../models/favoritesModel.js";
import ThesisDocument from "../models/thesisModel.js";
// Create a new favorite
export async function createFavorite(req, res) {
  try {
    const { userId, caseId } = req.body;

    // Check if favorite already exists
    const existingFavorite = await Favorites.findOne({ userId, caseId });
    if (existingFavorite) {
      return res
        .status(400)
        .json({ message: "This case is already in favorites" });
    }

    const favorite = new Favorites({
      userId,
      caseId,
    });

    const savedFavorite = await favorite.save();

    // Increment ratingCount by 1
    await ThesisDocument.findByIdAndUpdate(
      caseId,
      { $inc: { ratingCount: 1 } },
      { new: true }
    );

    res.status(201).json(savedFavorite);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get all favorites with optional parameters
export async function getAllFavorites(req, res) {
  const { id } = req.params;
  try {
    const favorites = await Favorites.find({ userId: id })
      .populate("userId")
      .populate({
        path: "caseId",
        model: ThesisDocument,
        populate: {
          path: "students", // Populate the students array of ids
          model: "users", // Assuming students are referenced in the users model
        },
      });

    res.status(200).json(favorites);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Update a favorite

// Delete a favorite
export async function deleteFavorite(req, res) {
  try {
    const { userId, caseId } = req.params;

    // Find the favorite using userId and caseId
    const favorite = await Favorites.findOne({ userId, caseId });
    if (!favorite) {
      return res.status(404).json({ message: "Favorite not found" });
    }

    // Decrement the case ratingCount by 1
    await ThesisDocument.findByIdAndUpdate(
      caseId,
      { $inc: { ratingCount: -1 } },
      { new: true }
    );

    await favorite.deleteOne();
    res.status(200).json({ message: "Favorite deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
