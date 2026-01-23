import panelApprovalModel from "../models/panelApprovalModel.js";
import adviserAcceptanaceModel from "../models/adviserAcceptanaceModel.js";
import thesisModel from "../models/thesisModel.js";

export async function getUserApproval(req, res) {
  const { id } = req.params;

  try {
    const adviserAcceptanceRequestData = await adviserAcceptanaceModel
      .findOne({
        role: "adviser",
        $or: [{ student1Id: id }, { student2Id: id }, { student3Id: id }],
      })
      .sort({ createdAt: -1 }); // newest first

    if (!adviserAcceptanceRequestData) {
      return res.status(200).send([]);
    }

    console.log(
      "Adviser Acceptance Request Data:",
      adviserAcceptanceRequestData,
    );

    const userPanelApprovals = await panelApprovalModel
      .find({
        proposalId: adviserAcceptanceRequestData._id,
      })
      .populate("panelId");

    console.log("User Panel Approvals:", userPanelApprovals);
    return res.status(200).send(userPanelApprovals);
  } catch (error) {
    console.error("Error fetching adviser acceptance request:", error);
    return res.status(500).send({ error: "Internal server error" });
  }
}

export async function addPanelRequest(req, res) {
  try {
    console.log("📥 BODY:", req.body);
    console.log("📎 FILE:", req.file);

    const { faculty1, faculty2, faculty3, faculty4, proposalId, proposeTitle } =
      req.body;

    if (!proposalId)
      return res.status(400).json({ message: "proposalId is missing" });
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded." });

    // 1️⃣ Find adviser acceptance
    const adviserAcceptance =
      await adviserAcceptanaceModel.findById(proposalId);
    if (!adviserAcceptance)
      return res.status(404).json({ message: "Adviser acceptance not found" });

    // 2️⃣ Extract student IDs
    const studentIds = [
      adviserAcceptance.student1Id,
      adviserAcceptance.student2Id,
      adviserAcceptance.student3Id,
    ].filter(Boolean);

    // 3️⃣ Find thesis
    const thesis = await thesisModel.findOne({ students: { $in: studentIds } });
    if (!thesis)
      return res
        .status(404)
        .json({ message: "No thesis found for the given students" });

    // 4️⃣ Panel with roles
    const panelWithRoles = [
      faculty1 && { panelId: faculty1, role: "panelChairperson" },
      faculty2 && { panelId: faculty2, role: "panel" },
      faculty3 && { panelId: faculty3, role: "panel" },
      faculty4 && { panelId: faculty4, role: "oralSecretary" },
    ].filter(Boolean);

    if (panelWithRoles.length === 0)
      return res.status(400).json({ message: "No valid panel data provided" });

    // 5️⃣ Insert approvals
    await panelApprovalModel.insertMany(
      panelWithRoles.map(({ panelId, role }) => ({
        proposalId,
        panelId,
        role,
        proposeTitle,
        thesisFile: req.file.path,
      })),
    );

    // 6️⃣ Update thesis
    thesis.panels = panelWithRoles.map((p) => p.panelId);
    thesis.panelApprovals = panelWithRoles.map((p) => ({
      panel: p.panelId,
      status: "pending",
      remarks: "",
    }));
    thesis.documentLink = req.file.path;
    thesis.status = "pending";

    await thesis.save();

    return res
      .status(201)
      .json({ message: "Panel requests created successfully" });
  } catch (error) {
    console.error("🔥 ERROR NAME:", error.name);
    console.error("🔥 ERROR MESSAGE:", error.message);
    console.error("🔥 FULL ERROR:", error);
    return res
      .status(500)
      .console({ message: "Server error", error: error.message });
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
      { new: true }, // return the updated document
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
          (pa) => pa.panel.toString() === panelApproval.panelId.toString(),
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
