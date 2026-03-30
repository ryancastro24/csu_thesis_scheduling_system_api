import studentNotifications from "../models/stundentNotificationModel.js";
export async function getStudentNotifications(req, res) {
  try {
    const { studentId } = req.params;

    const notifications = await studentNotifications
      .find({
        $or: [
          { student1: studentId },
          { student2: studentId },
          { student3: studentId },
        ],
      })

      .sort({ createdAt: -1 })
      .populate("adviserId")
      .populate("coadviserId"); // optional: latest first
    return res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching student notifications:", error);
    return res.status(500).json({
      message: "Error fetching notifications",
      error: error.message,
    });
  }
}

export async function markReadAllNotifications(req, res) {
  try {
    const { studentId } = req.params;

    console.log("i was triigerred");
    const result = await studentNotifications.updateMany(
      {
        $or: [
          { student1: studentId },
          { student2: studentId },
          { student3: studentId },
        ],
      },
      {
        $set: { read: true },
      },
    );

    return res.status(200).json({
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return res.status(500).json({
      message: "Error updating notifications",
      error: error.message,
    });
  }
}
