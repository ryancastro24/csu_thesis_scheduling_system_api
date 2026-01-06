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
      thesisFile: req.file.path,
      proposeTitle,
      status: "pending", // default status
    });
    records.push(adviserRecord);

    // 2️⃣ Create record for co-adviser (if provided)
    if (coAdviser) {
      const coAdviserRecord = await adviserAcceptanaceModel.create({
        student1Id: student1,
        ...(student2 && { student2Id: student2 }),
        ...(student3 && { student3Id: student3 }),
        adviserId: coAdviser,
        thesisFile: req.file.path,
        proposeTitle,
        status: "pending", // default status
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
      .sort({ createdAt: -1 }); // newest first

    return res.status(200).send(adviserAcceptanceRequestData);
  } catch (error) {
    console.error("Error fetching adviser acceptance request:", error);
    return res.status(500).send({ error: "Internal server error" });
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

export async function approvedProposal(req, res) {
  const { status, remarks } = req.body;
  const { id } = req.params;

  try {
    // 1. Update the status of the proposal
    const approveProposalData = await adviserAcceptanaceModel.findByIdAndUpdate(
      id,
      { status },
      { new: true } // returns the updated document
    );

    // 2. If the proposal is approved, create a new thesis record
    if (approveProposalData.status === "approve") {
      const thesisModelData = await thesisModel.create({
        students: [
          approveProposalData.student1Id,
          approveProposalData.student2Id,
          approveProposalData.student3Id,
        ],
        thesisTitle: approveProposalData.proposeTitle,
        adviser: approveProposalData.adviserId,
        type: "proposal",
      });

      return res.status(200).json({
        message: "Proposal approved and thesis created",
        thesisModelData,
      });
    }

    if (approveProposalData.status === "reject") {
      const approveProposalData =
        await adviserAcceptanaceModel.findByIdAndUpdate(
          id,
          { remarks },
          { new: true } // returns the updated document
        );
    }

    return res.status(200).json({
      message: "Proposal status updated",
      approveProposalData,
    });
  } catch (error) {
    console.error("Error approving proposal:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
