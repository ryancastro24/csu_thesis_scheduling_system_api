import panelApprovalModel from "../models/panelApprovalModel.js";
import adviserAcceptanaceModel from "../models/adviserAcceptanaceModel.js";
import thesisModel from "../models/thesisModel.js";
export async function getUserApproval(req, res) {
  const { id } = req.params;

  try {
    const adviserAcceptanceRequestData = await adviserAcceptanaceModel
      .findOne({
        $or: [{ student1Id: id }, { student2Id: id }, { student3Id: id }],
      })
      .sort({ createdAt: -1 }); // newest first

    if (!adviserAcceptanceRequestData) {
      return res.status(200).send([]);
    }

    const userPanelApprovals = await panelApprovalModel
      .find({
        proposalId: adviserAcceptanceRequestData._id,
      })
      .populate("panelId");

    return res.status(200).send(userPanelApprovals);
  } catch (error) {
    console.error("Error fetching adviser acceptance request:", error);
    return res.status(500).send({ error: "Internal server error" });
  }
}

export async function addPanelRequest(req, res) {
  const { faculty1, faculty2, faculty3, faculty4, proposalId, proposeTitle } =
    req.body;

  console.log("file uploaded", req.file);

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  try {
    const panelRequests = [
      {
        proposalId,
        panelId: faculty1,
        proposeTitle,
        thesisFile: req.file.path,
      },
      {
        proposalId,
        panelId: faculty2,
        proposeTitle,
        thesisFile: req.file.path,
      },
      {
        proposalId,
        panelId: faculty3,
        proposeTitle,
        thesisFile: req.file.path,
      },
      {
        proposalId,
        panelId: faculty4,
        proposeTitle,
        thesisFile: req.file.path,
      },
    ];

    // Create all four documents at once
    const createdPanels = await panelApprovalModel.insertMany(panelRequests);

    return res.status(201).json({
      message: "Panel approval requests created successfully",
      data: createdPanels,
    });
  } catch (error) {
    console.error("Error creating panel approval requests:", error);
    return res.status(500).json({ error: "Failed to create panel requests" });
  }
}

export async function changePanel(req, res) {
  try {
    const { newPanelId } = req.body;
    const { id, oldPanelId } = req.params;

    // Find and update the panel approval document
    const updatedPanel = await panelApprovalModel.findOneAndUpdate(
      { _id: id, panelId: oldPanelId }, // filter
      {
        panelId: newPanelId,
        status: "pending",
        remarks: "",
      }, // update
      { new: true } // return the updated document
    );

    if (!updatedPanel) {
      return res
        .status(404)
        .json({ message: "Panel not found or update failed." });
    }

    return res.status(200).json({
      message: "Panel updated successfully.",
      data: updatedPanel,
    });
  } catch (error) {
    console.error("Error updating panel:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
}

export async function getPanelRequests(req, res) {
  try {
    const { id } = req.params;

    const panelApprovalData = await panelApprovalModel
      .find({
        panelId: id,
        status: { $in: ["approve", "pending"] },
      })
      .populate({
        path: "proposalId",
        populate: [
          { path: "student1Id" },
          { path: "student2Id" },
          { path: "student3Id" },
        ],
      });

    return res.status(200).send(panelApprovalData);
  } catch (error) {
    console.error("Error fetching panel requests:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
}

export async function updatePanelApproval(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const panelApproval = await panelApprovalModel.findById(id).populate({
      path: "proposalId",
      populate: [
        { path: "student1Id" },
        { path: "student2Id" },
        { path: "student3Id" },
      ],
    });

    if (!panelApproval) {
      return res.status(404).json({ message: "Panel approval not found." });
    }

    if (status === "approve" || status === "reject") {
      panelApproval.status = status;

      const studentIds = [
        panelApproval.proposalId.student1Id?._id,
        panelApproval.proposalId.student2Id?._id,
        panelApproval.proposalId.student3Id?._id,
      ];

      const thesis = await thesisModel.findOne({
        students: { $all: studentIds },
      });

      if (thesis && status === "approve") {
        // Add panelId to panels[] if not already present
        if (!thesis.panels.includes(panelApproval.panelId)) {
          thesis.panels.push(panelApproval.panelId);
        }

        // Add panel object to panelApprovals[] if not already present
        const isAlreadyInPanelApprovals = thesis.panelApprovals.some(
          (pa) => pa.panel.toString() === panelApproval.panelId.toString()
        );

        if (!isAlreadyInPanelApprovals) {
          thesis.panelApprovals.push({
            panel: panelApproval.panelId,
            status: "pending",
            remarks: "",
          });
        }

        await thesis.save();
      }
    } else {
      return res.status(400).json({
        message: "Invalid status value. Use 'approve' or 'reject'.",
      });
    }

    const updated = await panelApproval.save();

    return res.status(200).json({
      message: `Panel approval ${status}d successfully.`,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating panel approval status:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
}
