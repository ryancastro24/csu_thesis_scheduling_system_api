import thesisModel from "../models/thesisModel.js";
import schedulesModel from "../models/schedulesModel.js";
import mongoose from "mongoose";
import Favorites from "../models/favoritesModel.js";
import notification from "../models/notification.js";

// 🔹 Update thesis document schedule
export async function updateThesisSchedule(req, res) {
  try {
    const { id } = req.params;
    const { date, time, venue } = req.body;

    // Find the thesis document
    const thesis = await thesisModel.findById(id);

    if (!thesis) {
      return res.status(404).json({ message: "Thesis document not found" });
    }

    // Get all users involved in the thesis
    const adminId = thesis.adviser; // Using adviser as admin for this case
    const scheduleUsers = [
      ...(thesis.students || []).filter(Boolean), // remove null/undefined students
      thesis.adviser,
      thesis.coAdviser,
      ...(thesis.panels || []),
    ].filter(Boolean); // also ensure a
    // Delete existing schedules
    await schedulesModel.deleteMany({ _id: thesis.schedule });

    // Create new schedules for all users
    const schedules = await schedulesModel.insertMany(
      scheduleUsers.map((userId) => ({
        date,
        time,
        eventType: thesis.thesisTitle,
        userId,
      })),
    );

    const adminSchedule = schedules.find(
      (schedule) => schedule.userId.toString() === adminId.toString(),
    );

    if (!adminSchedule) {
      return res.status(500).json({
        message: "Error: Admin schedule not found after creation.",
      });
    }

    // Reset all panel approvals to pending
    const updatedPanelApprovals = thesis.panelApprovals.map((approval) => ({
      ...approval.toObject(),
      status: "pending",
      remarks: "pending",
    }));

    // Update the thesis document
    const updatedThesis = await thesisModel.findByIdAndUpdate(
      id,
      {
        panelApprovals: updatedPanelApprovals,
        schedule: adminSchedule._id,
        venue: venue,
        reschedule: false,
        status: "pending",
      },
      { new: true },
    );

    // Create notifications for all panels
    const notificationPromises = thesis.panels.map(async (panelId) => {
      return notification.create({
        status: "Schedule Updated",
        remarks: `Thesis schedule has been updated to ${date} at ${time}`,
        thesisId: thesis._id,
        userId: panelId,
      });
    });

    await Promise.all(notificationPromises);

    res.status(200).json({
      message: "Thesis schedule updated successfully",
      updatedThesis,
    });
  } catch (error) {
    console.error("Error updating thesis schedule:", error);
    res.status(500).json({ message: "Error updating thesis schedule", error });
  }
}

// 🔹 Get all thesis documents
export async function getAllThesis(req, res) {
  try {
    const thesisDocumentsData = await thesisModel
      .find({
        defended: true,
        $expr: {
          $eq: [
            {
              $size: {
                $filter: {
                  input: "$panelApprovals",
                  cond: { $ne: ["$$this.status", "approve"] },
                },
              },
            },
            0,
          ],
        },
      }) // Only return theses where all panel approvals are "approve"
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

export async function getAllPendingThesis(req, res) {
  try {
    const { department } = req.query; // e.g., ?department=BSCS

    if (!department) {
      return res.status(400).json({ message: "Department is required" });
    }

    const thesisDocumentsData = await thesisModel
      .find({ forScheduleStatus: { $ne: "idle" } })
      .populate({
        path: "students",
        populate: {
          path: "departmentId", // populate department inside users
          model: "departments",
        },
      })
      .populate("adviser")
      .populate("panels")
      .populate("schedule")
      .populate("panelApprovals.panel")
      .sort({ ratingCount: -1 });

    // Filter theses where at least one student belongs to the given department acronym
    const filteredTheses = thesisDocumentsData.filter((thesis) =>
      thesis.students.some(
        (student) =>
          student.departmentId && student.departmentId.acronym === department,
      ),
    );

    // Update statuses based on approvals
    await Promise.all(
      filteredTheses.map(async (thesis) => {
        const allApproved = thesis.panelApprovals.every(
          (approval) => approval.status === "approve",
        );

        if (allApproved) {
          thesis.status = "approved";
        } else if (
          thesis.panelApprovals.some((approval) => approval.status === "reject")
        ) {
          thesis.reschedule = true;
          thesis.status = "rejected";

          await schedulesModel.deleteMany({
            userId: { $in: thesis.panels },
            eventType: thesis.thesisTitle,
          });
        }
      }),
    );

    res.status(200).json(filteredTheses);
  } catch (error) {
    console.error("Error retrieving thesis documents:", error);
    res
      .status(500)
      .json({ message: "Error retrieving thesis documents", error });
  }
}

// get all thesis documents that are finalized
export async function getFinalAllThesisDocument(req, res) {
  try {
    const thesisDocumentsData = await thesisModel
      .find({
        defended: "defended",
      })
      .populate("students")
      .populate("adviser")
      .populate("panels")
      .populate("schedule")
      .populate("panelApprovals.panel")
      .sort({ ratingCount: -1 });

    // Compute status in-memory only (no DB writes)
    const processedTheses = thesisDocumentsData.map((thesis) => {
      const thesisObj = thesis.toObject();

      if (thesisObj.panelApprovals?.length) {
        const allApproved = thesisObj.panelApprovals.every(
          (approval) => approval.status === "approve",
        );

        const anyRejected = thesisObj.panelApprovals.some(
          (approval) => approval.status === "reject",
        );

        if (allApproved) {
          thesisObj.status = "approved";
        } else if (anyRejected) {
          thesisObj.status = "rejected";
          thesisObj.reschedule = true;
        }
      }

      return thesisObj;
    });

    res.status(200).json(processedTheses);
  } catch (error) {
    console.error("Error retrieving final thesis documents:", error);
    res.status(500).json({
      message: "Error retrieving final thesis documents",
      error,
    });
  }
}

export async function getAllThesisDocument(req, res) {
  try {
    const thesisDocumentsData = await thesisModel
      .find()
      .populate("students")
      .populate("adviser")
      .populate("panels")
      .populate("schedule")
      .populate("panelApprovals.panel")
      .sort({ ratingCount: -1 });

    // Compute status in-memory only (no DB writes)
    const processedTheses = thesisDocumentsData.map((thesis) => {
      const thesisObj = thesis.toObject();

      if (thesisObj.panelApprovals?.length) {
        const allApproved = thesisObj.panelApprovals.every(
          (approval) => approval.status === "approve",
        );

        const anyRejected = thesisObj.panelApprovals.some(
          (approval) => approval.status === "reject",
        );

        if (allApproved) {
          thesisObj.status = "approved";
        } else if (anyRejected) {
          thesisObj.status = "rejected";
          thesisObj.reschedule = true;
        }
      }

      return thesisObj;
    });

    res.status(200).json(processedTheses);
  } catch (error) {
    console.error("Error retrieving final thesis documents:", error);
    res.status(500).json({
      message: "Error retrieving final thesis documents",
      error,
    });
  }
}
// get thesis by panel

export async function getThesisByPanel(req, res) {
  try {
    const { panelId } = req.params;

    const thesisDocumentsData = await thesisModel
      .find({
        panels: panelId,
        panelApprovals: { $elemMatch: { panel: panelId, status: "pending" } },
        forScheduleStatus: "approve", // <-- Add this condition
      })
      .populate("students")
      .populate("adviser")
      .populate("panels")
      .populate("schedule")
      .populate("panelApprovals.panel");

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
    const { thesisId, panelId } = req.params;
    const { status, remarks } = req.body;

    // Build update object dynamically
    const updateFields = {
      "panelApprovals.$.status": status,
    };

    // Only update remarks if provided
    if (remarks && remarks.trim() !== "") {
      updateFields["panelApprovals.$.remarks"] = remarks;
    }

    if (status === "rejected") {
      updateFields["reschedule"] = true;
    }

    const updatedThesis = await thesisModel.findOneAndUpdate(
      {
        _id: thesisId,
        "panelApprovals.panel": panelId,
      },
      {
        $set: updateFields,
      },
      { new: true },
    );

    if (!updatedThesis) {
      return res.status(404).json({ message: "Thesis or Panel not found" });
    }

    // Create notification (remarks optional)
    const notificationData = {
      thesisId,
      userId: panelId,
      status,
    };

    if (remarks && remarks.trim() !== "") {
      notificationData.remarks = remarks;
    }

    const newNotification = new notification(notificationData);
    await newNotification.save();

    res.status(200).json({
      message: "Panel approval updated successfully",
      updatedThesis,
    });
  } catch (error) {
    console.error("Error updating panel approval:", error);
    res.status(500).json({
      message: "Error updating panel approval",
      error,
    });
  }
}

export async function deleteCase(req, res) {
  try {
    const { id } = req.params; // Get thesis ID from request params

    // Ensure the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid thesis ID" });
    }

    const deletedThesis = await thesisModel.findByIdAndDelete(id);

    if (!deletedThesis) {
      return res.status(404).json({ message: "Thesis not found" });
    }

    // Also delete the favorite with the caseId: id
    await Favorites.deleteOne({ caseId: id });

    res
      .status(200)
      .json({ message: "Thesis deleted successfully", deletedThesis });
  } catch (error) {
    console.error("Error deleting thesis:", error);
    res.status(500).json({
      message: "Error deleting thesis",
      error: {
        stringValue: `"${id}"`,
        valueType: "string",
        kind: "ObjectId",
        value: id,
        path: "_id",
      },
    });
  }
}

export async function getApprovedThesisByPanel(req, res) {
  try {
    const { panelId } = req.params; // Extract panel ID from request params

    const thesisDocumentsData = await thesisModel
      .find({
        panels: panelId,
        panelApprovals: { $elemMatch: { panel: panelId, status: "approve" } }, // Ensure the panel's status is approved
      })
      .populate("students") // Populate student details
      .populate("adviser") // Populate adviser details
      .populate("panels") // Populate panel members
      .populate("schedule") // Populate schedule details
      .populate("panelApprovals.panel"); // Populate panel approvals with panel details

    await Promise.all(
      thesisDocumentsData.map(async (thesis) => {
        const allApproved = thesis.panelApprovals.every(
          (approval) => approval.status === "approve",
        );

        if (allApproved) {
          thesis.status = "approved"; // Update thesis status to approved
        } else if (
          thesis.panelApprovals.some((approval) => approval.status === "reject")
        ) {
          thesis.reschedule = true;
          thesis.status = "rejected"; // Update thesis status to rejected
          await schedulesModel.deleteMany({
            userId: { $in: thesis.panels },
            eventType: thesis.thesisTitle,
          });
        }
      }),
    );

    res.status(200).json(thesisDocumentsData);
  } catch (error) {
    console.error("Error retrieving thesis documents for panel:", error);
    res
      .status(500)
      .json({ message: "Error retrieving thesis documents", error });
  }
}
// adjust path if needed

export async function createThesisDocument(req, res) {
  try {
    const thesisFile = req.files["thesisFile"]?.[0];
    const approvalFile = req.files["approvalFile"]?.[0];

    console.log("Uploaded Files:", req.files);
    console.log("Thesis File:", thesisFile);
    console.log("Approval File:", approvalFile);

    if (!thesisFile || !approvalFile) {
      return res.status(400).json({ message: "Both files are required." });
    }

    const { userId } = req.body;

    if (!userId) {
      console.log("User ID not provided in request body.");
      return res.status(400).json({ message: "User ID is required." });
    }

    // Find and update thesis where userId exists in students array
    const updatedThesis = await thesisModel.findOneAndUpdate(
      { students: userId },
      {
        documentLink: thesisFile.path,
        approvalFile: approvalFile.path,
        forScheduleStatus: "pending",
      },
      { new: true },
    );

    if (!updatedThesis) {
      return res
        .status(404)
        .json({ message: "Thesis record not found for this user." });
    }

    return res.status(200).json({
      message: "Thesis document uploaded successfully.",
      updatedThesis,
    });

    console.log("Updated Thesis:", updatedThesis);
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "File upload failed." });
  }
}

export async function createFinalThesisDocument(req, res) {
  try {
    const thesisFile = req.files["thesisFile"]?.[0];
    const approvalFile = req.files["approvalFile"]?.[0];

    if (!thesisFile || !approvalFile) {
      return res.status(400).json({ message: "Both files are required." });
    }

    const { thesisId } = req.body;

    if (!thesisId) {
      return res.status(400).json({ message: "Thesis ID is required." });
    }

    // Find and update thesis where userId exists in students array
    const updatedThesis = await thesisModel.findOneAndUpdate(
      { _id: thesisId },
      {
        documentLink: thesisFile.path,
        approvalFile: approvalFile.path,
        forScheduleStatus: "pending",
      },
      { new: true },
    );

    if (!updatedThesis) {
      return res
        .status(404)
        .json({ message: "Thesis record not found for this user." });
    }

    return res.status(200).json({
      message: "Thesis document uploaded successfully.",
      updatedThesis,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({ error: "File upload failed." });
  }
}

export async function getUserThesisModel(req, res) {
  const { id } = req.params;

  const userThesisModel = await thesisModel
    .findOne({ students: id, type: "proposal" })
    .populate("schedule");

  return res.status(200).send(userThesisModel);
}

export async function getUserFinalThesisModel(req, res) {
  const { id } = req.params;

  const userThesisModel = await thesisModel
    .findOne({ students: id, type: "final" })
    .populate("schedule");

  return res.status(200).send(userThesisModel);
}

export async function updateThesisScheduleApproval(req, res) {
  const { id } = req.params;
  const { forScheduleStatus } = req.body;

  try {
    const updatedThesis = await thesisModel.findOneAndUpdate(
      { _id: id }, // filter
      { forScheduleStatus: forScheduleStatus }, // update
      { new: true }, // return the updated document
    );

    if (!updatedThesis) {
      return res.status(404).json({ message: "Thesis not found" });
    }

    return res.status(200).json(updatedThesis);
  } catch (error) {
    return res.status(500).json({ message: "Error updating thesis", error });
  }
}

export async function getThesisByAdviser(req, res) {
  try {
    const { adviserId } = req.params;
    const thesisDocumentsData = await thesisModel
      .find({ adviser: adviserId })
      .populate("students")
      .populate("adviser")
      .populate("panels")
      .populate("schedule")
      .populate("panelApprovals.panel");

    res.status(200).json(thesisDocumentsData);
  } catch (error) {
    console.error("Error retrieving thesis documents for adviser:", error);
    res
      .status(500)
      .json({ message: "Error retrieving thesis documents", error });
  }
}

export async function updateThesisToDefended(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const thesis = await thesisModel.findById(id);

    if (!thesis) {
      return res.status(404).json({ message: "Thesis not found" });
    }

    /**
     * ===============================
     * 1️⃣ Update thesis final status
     * ===============================
     */
    if (status) {
      thesis.thesisFinalStatus = status;
    }

    /**
     * =====================================
     * 🔁 SPECIAL CASE: RE-DEFENSE
     * =====================================
     */
    if (status === "redefense") {
      thesis.schedule = null;
      thesis.status = "pending";
      thesis.defended = false;
      thesis.forScheduleStatus = "pending";
      thesis.thesisFinalStatus = status;

      thesis.panelApprovals = thesis.panelApprovals.map((p) => ({
        ...p.toObject(),
        status: "pending",
      }));

      await thesis.save();

      return res.status(200).json({
        message:
          "Thesis marked for re-defense. Schedule cleared and panel approvals reset.",
        thesis,
      });
    }

    /**
     * ======================================
     * 2️⃣ Statuses that can create FINAL
     * ======================================
     */
    const FINAL_TRIGGER_STATUSES = [
      "defended",
      "minor revision",
      "major revision",
    ];

    /**
     * ======================================
     * 3️⃣ If this is already a FINAL thesis
     * ======================================
     */
    if (thesis.type === "final") {
      thesis.defended = status === "defended";
      await thesis.save();

      return res.status(200).json({
        message: "Final thesis updated",
        thesis,
      });
    }

    /**
     * ======================================
     * 4️⃣ Check if FINAL already exists
     * ======================================
     */
    /**
     * ======================================
     * 4️⃣ Check if FINAL already exists
     * ======================================
     */
    const existingFinalThesis = await thesisModel.findOne({
      thesisTitle: thesis.thesisTitle,
      type: "final",
    });

    /**
     * ======================================
     * 5️⃣ Update proposal thesis
     * ======================================
     */
    if (FINAL_TRIGGER_STATUSES.includes(status)) {
      thesis.defended = status === "defended";
    }

    await thesis.save();

    /**
     * ======================================
     * 6️⃣ Create FINAL thesis (ONLY ONCE)
     * ======================================
     */
    if (!existingFinalThesis && FINAL_TRIGGER_STATUSES.includes(status)) {
      const finalThesis = new thesisModel({
        ...thesis.toObject(),
        _id: new mongoose.Types.ObjectId(),

        parentThesisId: thesis._id,
        type: "final",

        // reset FINAL thesis state
        defended: false,
        status: "pending",
        forScheduleStatus: "idle",
        thesisFinalStatus: "pending",

        approvalFile: "",
        documentLink: "",
        schedule: null,
        ratingCount: 0,

        panelApprovals: thesis.panelApprovals.map((p) => ({
          ...p.toObject(),
          status: "pending",
        })),

        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await finalThesis.save();

      return res.status(200).json({
        message: "Final thesis created from proposal",
        proposalThesis: thesis,
        finalThesis,
      });
    }

    /**
     * ======================================
     * 7️⃣ FINAL already exists → no creation
     * ======================================
     */
    return res.status(200).json({
      message: "Thesis status updated. Final thesis already exists.",
      proposalThesis: thesis,
      existingFinalThesis,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error updating thesis",
      error: error.message,
    });
  }
}

// get  specific thesis document by ID
export async function getThesisDocumentById(req, res) {
  const { id } = req.params;

  console.log("Fetching thesis document with ID:", id);

  try {
    const thesisDocument = await thesisModel
      .findById(id)
      .populate("students")
      .populate("adviser")
      .populate("panels")
      .populate("schedule")
      .populate("panelApprovals.panel");

    if (!thesisDocument) {
      return res.status(404).json({ message: "Thesis document not found" });
    }

    return res.status(200).json(thesisDocument);
  } catch (error) {
    console.error("Error retrieving thesis document:", error);
    return res
      .status(500)
      .json({ message: "Error retrieving thesis document", error });
  }
}
