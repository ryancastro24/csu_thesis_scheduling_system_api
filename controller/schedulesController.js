import schedulesModel from "../models/schedulesModel.js";

// 🔹 Get all schedules
export async function getAllSchedules(req, res) {
  try {
    const scheduleData = await schedulesModel.find();
    return res.status(200).json(scheduleData);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving schedules", error });
  }
}

// 🔹 Create a new schedule
export async function createSchedule(req, res) {
  try {
    const { date, time, eventType, userId } = req.body;

    const newSchedule = new schedulesModel({
      date,
      time,
      eventType,
      userId,
    });

    await newSchedule.save();
    res
      .status(201)
      .json({ message: "Schedule created successfully", newSchedule });
  } catch (error) {
    res.status(500).json({ message: "Error creating schedule", error });
  }
}
