import thesisModel from "../models/thesisModel.js";

// 🔹 Create a new thesis document
export async function createThesisDocument(req, res) {
  try {
    const {
      thesisTitle,
      students,
      advisers,
      panels,
      type,
      document,
      schedule,
    } = req.body;

    // Create panel approvals with default "pending" status
    const panelApprovals = panels.map((panel) => ({
      panel,
      status: "pending",
      remarks: "pending",
    }));

    const newThesis = new thesisModel({
      thesisTitle,
      students,
      advisers,
      panels,
      panelApprovals,
      type,
      document,
      schedule,
    });

    await newThesis.save();
    res
      .status(201)
      .json({ message: "Thesis document created successfully", newThesis });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error creating thesis document", error });
  }
}

// 🔹 Get all thesis documents
export async function getAllThesis(req, res) {
  try {
    const thesisDocumentsData = await thesisModel
      .find()
      .populate("students advisers panels schedule");
    res.status(200).json(thesisDocumentsData);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Error retrieving thesis documents", error });
  }
}
