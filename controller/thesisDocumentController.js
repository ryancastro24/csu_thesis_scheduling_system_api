import thesisModel from "../models/thesisModel.js";
import schedulesModel from "../models/schedulesModel.js";
import mongoose from "mongoose";

export async function createThesisDocument(req, res) {
  try {
    const {
      thesisTitle,
      student1,
      student2,
      student3,
      adviser,
      panel1,
      panel2,
      panel3,
      panel4,
      venue,
      type,
      document: documentFile,
      date,
      time,
    } = req.body;

    // Validate required fields
    if (!thesisTitle || !date || !time) {
      return res
        .status(400)
        .json({ message: "Thesis title, date, and time are required." });
    }

    // Admin ID (Make sure it's a valid ObjectId)
    const adminId = new mongoose.Types.ObjectId("67d1534860798a27a35b0cc9");

    // Validate and convert IDs to ObjectId format
    const students = [student1, student2, student3]
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const panels = [panel1, panel2, panel3, panel4]
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const validAdviser = mongoose.Types.ObjectId.isValid(adviser)
      ? new mongoose.Types.ObjectId(adviser)
      : null;

    // Add the adminId to the list of users who need schedules
    const scheduleUsers = [...panels, adminId];

    // Create multiple schedules, one for each panelist and the admin
    const schedules = await schedulesModel.insertMany(
      scheduleUsers.map((userId) => ({
        date,
        time,
        eventType: thesisTitle,
        userId, // Assign the specific userId (panelists and admin)
      }))
    );

    // Find the schedule created for the admin
    const adminSchedule = schedules.find(
      (schedule) => schedule.userId.toString() === adminId.toString()
    );

    if (!adminSchedule) {
      return res.status(500).json({
        message: "Error: Admin schedule not found after creation.",
      });
    }

    // Create panel approvals with default "pending" status
    const panelApprovals = panels.map((panel) => ({
      panel,
      status: "pending",
      remarks: "pending",
    }));

    // Create Thesis Document with only the Admin's schedule
    const newThesis = new thesisModel({
      thesisTitle,
      students,
      adviser: validAdviser,
      panels,
      venue,
      panelApprovals,
      type,
      document: documentFile || "", // Ensure document is handled
      schedule: adminSchedule._id, // **Only store the schedule of the Admin**
    });

    await newThesis.save();

    res.status(201).json({
      message: "Thesis document created successfully",
      newThesis,
    });
  } catch (error) {
    console.error("Error creating thesis document:", error);
    res.status(500).json({ message: "Error creating thesis document", error });
  }
}

// 🔹 Get all thesis documents
export async function getAllThesis(req, res) {
  try {
    const thesisDocumentsData = await thesisModel
      .find()
      .populate("students") // Populate student details
      .populate("adviser") // Populate adviser details
      .populate("panels") // Populate panel members
      .populate("schedule") // Populate schedule details
      .populate("panelApprovals.panel") // Populate panel approvals with panel details
      .sort({ ratingCount: -1 }); // Sort by ratingCount in descending order

    res.status(200).json(thesisDocumentsData);
  } catch (error) {
    console.error("Error retrieving thesis documents:", error);
    res
      .status(500)
      .json({ message: "Error retrieving thesis documents", error });
  }
}

export async function getThesisByPanel(req, res) {
  try {
    const { panelId } = req.params; // Extract panel ID from request params

    const thesisDocumentsData = await thesisModel
      .find({ panels: panelId, status: "pending" }) // Filter by panelId & approved status
      .populate("students") // Populate student details
      .populate("adviser") // Populate adviser details
      .populate("panels") // Populate panel members
      .populate("schedule") // Populate schedule details
      .populate("panelApprovals.panel"); // Populate panel approvals with panel details

    res.status(200).json(thesisDocumentsData);
  } catch (error) {
    console.error("Error retrieving thesis documents for panel:", error);
    res
      .status(500)
      .json({ message: "Error retrieving thesis documents", error });
  }
}

export async function updatePanelApproval(req, res) {
  try {
    const { thesisId, panelId } = req.params; // Get thesis & panel ID from request params
    const { status, remarks } = req.body; // Get new status & remarks from request body

    // Find & Update the panelApproval status for the specific panel
    const updatedThesis = await thesisModel.findOneAndUpdate(
      {
        _id: thesisId, // Find thesis by ID
        "panelApprovals.panel": panelId, // Find the specific panel in panelApprovals
      },
      {
        $set: {
          "panelApprovals.$.status": status, // Update only the matched panel's status
          "panelApprovals.$.remarks": remarks, // Update remarks (optional)
        },
      },
      { new: true } // Return updated document
    );

    if (!updatedThesis) {
      return res.status(404).json({ message: "Thesis or Panel not found" });
    }

    res
      .status(200)
      .json({ message: "Panel approval updated successfully", updatedThesis });
  } catch (error) {
    console.error("Error updating panel approval:", error);
    res.status(500).json({ message: "Error updating panel approval", error });
  }
}
