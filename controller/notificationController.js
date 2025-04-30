import notification from "../models/notification.js";

export async function getNotifications(req, res) {
  try {
    const notifications = await notification
      .find()
      .populate("thesisId", "thesisTitle") // Include thesisTitle
      .populate({
        path: "thesisId",
        populate: { path: "schedule" }, // Populate schedule details which is part of thesisId
      })
      .populate("userId", {
        name: {
          $concat: [
            "$firstname",
            " ",
            { $substr: ["$middlename", 0, 1] },
            ". ",
            "$lastname",
          ],
        },
      }) // Combine firstname, middlename, and lastname
      .select("status remarks read thesisId") // Include thesisId without schedule here
      .sort({ createdAt: -1 }); // Sort by createdAt in descending order

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error retrieving notifications:", error);
    res.status(500).json({ message: "Error retrieving notifications", error });
  }
}

export async function getNotificationsReaded(req, res) {
  try {
    const notifications = await notification
      .find({ read: false }) // Return only notifications where read is true
      .populate("thesisId", "thesisTitle") // Include thesisTitle
      .populate({
        path: "thesisId",
        populate: { path: "schedule" }, // Populate schedule details which is part of thesisId
      })
      .populate("userId", {
        name: {
          $concat: [
            "$firstname",
            " ",
            { $substr: ["$middlename", 0, 1] },
            ". ",
            "$lastname",
          ],
        },
      }) // Combine firstname, middlename, and lastname
      .select("status remarks read thesisId") // Include thesisId without schedule here
      .sort({ createdAt: -1 }); // Sort by createdAt in descending order

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error retrieving notifications:", error);
    res.status(500).json({ message: "Error retrieving notifications", error });
  }
}
export async function addNotification(req, res) {
  const { thesisId, userId, remarks, status } = req.body;

  // Validate required fields
  if (!thesisId || !userId || !remarks || !status) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newNotification = new notification({
      thesisId,
      userId,
      remarks,
      status,
    });
    const savedNotification = await newNotification.save();
    res.status(201).json(savedNotification);
  } catch (error) {
    console.error("Error adding notification:", error);
    res.status(500).json({ message: "Error adding notification", error });
  }
}

export async function updateNotification(req, res) {
  try {
    const updatedNotification = await notification.findByIdAndUpdate(
      req.params.id,
      { $set: { read: true } }, // Update only the read field to true
      { new: true, fields: { read: 1 } } // Return only the read field in the response
    );
    if (!updatedNotification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.status(200).json(updatedNotification);
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ message: "Error updating notification", error });
  }
}

export async function deleteNotification(req, res) {
  try {
    const deletedNotification = await notification.findByIdAndDelete(
      req.params.id
    );
    if (!deletedNotification) {
      return res.status(404).json({ message: "Notification not found" });
    }
    res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Error deleting notification", error });
  }
}
