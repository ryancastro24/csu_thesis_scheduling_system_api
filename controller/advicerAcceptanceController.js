import adviserAcceptanaceModel from "../models/adviserAcceptanaceModel.js";
import thesisModel from "../models/thesisModel.js";

export async function addAdviserApproval(req, res) {
  try {
    const { student1, student2, student3, adviser, coAdviser, proposeTitle } =
      req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    if (!student1 || !adviser || !proposeTitle) {
      return res
        .status(400)
        .json({ message: "student1, adviser, and proposeTitle are required." });
    }

    const records = [];

    // 1️⃣ Create record for main adviser
    const adviserRecord = await adviserAcceptanaceModel.create({
      student1Id: student1,
      ...(student2 && { student2Id: student2 }),
      ...(student3 && { student3Id: student3 }),
      adviserId: adviser,
      coAdviserId: coAdviser || null, // optional reference to co-adviser
      role: "adviser", // explicitly mark as main adviser
      thesisFile: req.file.path,
      proposeTitle,
      status: "pending",
    });
    records.push(adviserRecord);

    // 2️⃣ Create record for co-adviser (if provided)
    if (coAdviser) {
      const coAdviserRecord = await adviserAcceptanaceModel.create({
        student1Id: student1,
        ...(student2 && { student2Id: student2 }),
        ...(student3 && { student3Id: student3 }),
        adviserId: coAdviser,
        role: "coAdviser", // explicitly mark as co-adviser
        thesisFile: req.file.path,
        proposeTitle,
        status: "pending",
      });
      records.push(coAdviserRecord);
    }

    return res.status(200).send({
      message: "Request sent successfully",
      adviserApprovalData: records, // array of adviser & co-adviser records
    });
  } catch (error) {
    console.error("Error adding adviser approval:", error);
    return res.status(500).json({ message: "Internal Server Error", error });
  }
}

export async function getUserAdviserAcceptanceRequest(req, res) {
  const { id } = req.params;

  try {
    const adviserAcceptanceRequestData = await adviserAcceptanaceModel
      .find({
        $or: [{ student1Id: id }, { student2Id: id }, { student3Id: id }],
      })
      .populate("adviserId") // 👈 populate adviser
      .sort({ createdAt: -1 }); // newest first

    return res.status(200).json(adviserAcceptanceRequestData);
  } catch (error) {
    console.error("Error fetching adviser acceptance request:", error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
}

export async function getAdviserAcceptanceRequest(req, res) {
  const { id } = req.params;

  const adviserAcceptanceRequestData = await adviserAcceptanaceModel
    .find({
      adviserId: id,
      status: { $in: ["approve", "pending"] },
    })
    .populate("student1Id")
    .populate("student2Id")
    .populate("student3Id");

  return res.status(200).send(adviserAcceptanceRequestData);
}

// approve proposal function
export async function approvedProposal(req, res) {
  const { status, remarks } = req.body;
  const { id } = req.params;

  try {
    // 1. Update the current approval record
    const updatedApproval = await adviserAcceptanaceModel.findByIdAndUpdate(
      id,
      { status, remarks },
      { new: true },
    );

    if (!updatedApproval) {
      return res.status(404).json({ message: "Approval record not found" });
    }

    // 2. Fetch adviser & co-adviser approvals for the same proposal
    const approvals = await adviserAcceptanaceModel.find({
      student1Id: updatedApproval.student1Id,
      proposeTitle: updatedApproval.proposeTitle,
      role: { $in: ["adviser", "coAdviser"] },
    });

    const adviserRecord = approvals.find((a) => a.role === "adviser");
    const coAdviserRecord = approvals.find((a) => a.role === "coAdviser");

    const adviserApproved = adviserRecord?.status === "approve";
    const coAdviserApproved = coAdviserRecord?.status === "approve";

    // 3. If BOTH approved → create thesis
    if (adviserApproved && coAdviserApproved) {
      const existingThesis = await thesisModel.findOne({
        thesisTitle: updatedApproval.proposeTitle,
        students: updatedApproval.student1Id,
      });

      if (!existingThesis) {
        const thesisModelData = await thesisModel.create({
          students: [
            adviserRecord.student1Id,
            adviserRecord.student2Id,
            adviserRecord.student3Id,
          ].filter(Boolean),
          thesisTitle: adviserRecord.proposeTitle,
          adviser: adviserRecord.adviserId,
          coAdviser: adviserRecord.coAdviserId,
          type: "proposal",
        });

        return res.status(200).json({
          message: "Both adviser and co-adviser approved. Thesis created.",
          thesisModelData,
        });
      }

      return res.status(200).json({
        message: "Both approved. Thesis already exists.",
      });
    }

    // 4. Only one has approved so far
    return res.status(200).json({
      message: "Proposal status updated. Waiting for other approval.",
      updatedApproval,
    });
  } catch (error) {
    console.error("Error approving proposal:", error);
    return res.status(500).json({ error: error.message });
  }
}

export async function changeAdviserRequest(req, res) {
  const { id, adviserId } = req.params;

  console.log("Change adviser request received for new adviser ID:", adviserId);
  console.log("Target request ID to update:", id);
  try {
    const updatedRequest = await adviserAcceptanaceModel.findByIdAndUpdate(
      id,
      { adviserId: adviserId, status: "pending" },
      { new: true },
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    return res.status(200).json({
      message: "Adviser and co-adviser changed successfully",
      updatedRequest,
    });
  } catch (error) {
    console.error("Error changing adviser request:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
