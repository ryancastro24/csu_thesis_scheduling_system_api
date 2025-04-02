import schedulesModel from "../models/schedulesModel.js";
import mongoose from "mongoose";
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

export const generateSchedule = async (req, res) => {
  try {
    const {
      dateRange,
      startTime,
      endTime,
      panel1,
      panel2,
      panel3,
      chairperson,
      eventType, // Added eventType from request
    } = req.body;
    const adminId = new mongoose.Types.ObjectId("67d1534860798a27a35b0cc9");

    if (
      !dateRange ||
      !startTime ||
      !endTime ||
      !panel1 ||
      !panel2 ||
      !panel3 ||
      !chairperson
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Convert startTime and endTime to 24-hour format
    const startTime24 = convertTo24Hour(startTime);
    const endTime24 = convertTo24Hour(endTime);

    // Validate time range (must be between 9:00 AM and 6:00 PM)
    if (startTime24 < "09:00") {
      return res.status(200).json({
        message:
          "Starting time is too early. The schedule must start at 9:00 AM or later.",
      });
    }
    if (endTime24 > "18:00") {
      return res.status(200).json({
        message: "End time exceeded. The schedule must end by 6:00 PM.",
      });
    }

    // Determine which schedules to fetch
    const userIds =
      eventType === "Thesis"
        ? [panel1, panel2, panel3, chairperson, adminId]
        : [adminId];

    // Fetch all schedules for the relevant users
    const allSchedules = await schedulesModel.find({
      userId: { $in: userIds },
    });

    // Parse date range
    const [startDate, endDate] = dateRange
      .split(" - ")
      .map((date) => new Date(date.trim()));

    // Generate all dates within the range
    const availableDates = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      availableDates.push(currentDate.toISOString().split("T")[0]); // Format YYYY-MM-DD
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Find booked dates where the startTime is within 30 minutes of an existing schedule's time range
    const bookedDates = new Set();

    allSchedules.forEach((schedule) => {
      const [scheduleStart, scheduleEnd] = schedule.time
        .split(" - ")
        .map((time) => time.trim());

      // Convert times to Date objects for comparison
      const scheduleStartTime = new Date(
        `1970-01-01T${convertTo24Hour(scheduleStart)}:00Z`
      );
      const scheduleEndTime = new Date(
        `1970-01-01T${convertTo24Hour(scheduleEnd)}:00Z`
      );
      const requestedStartTime = new Date(`1970-01-01T${startTime24}:00Z`);

      // Check if requestedStartTime is within 30 minutes of the scheduleStartTime
      const thirtyMinutesLater = new Date(
        scheduleStartTime.getTime() + 30 * 60000
      );

      if (
        requestedStartTime >= scheduleStartTime &&
        requestedStartTime < thirtyMinutesLater
      ) {
        bookedDates.add(schedule.date);
      }
    });

    // Filter available dates
    const freeDates = availableDates.filter((date) => !bookedDates.has(date));

    if (freeDates.length === 0) {
      return res.status(200).json({
        message: `No available dates found for ${startTime} - ${endTime}.`,
      });
    }

    return res.status(200).json({ message: `Available Date: ${freeDates[0]}` });
  } catch (error) {
    console.error("Error generating schedule:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};

// Helper function to convert 12-hour time format to 24-hour format
function convertTo24Hour(time) {
  let [hours, minutes] = time.match(/\d+/g);
  const period = time.match(/AM|PM/i);

  hours = parseInt(hours, 10);
  minutes = minutes ? parseInt(minutes, 10) : 0;

  if (period && period[0].toUpperCase() === "PM" && hours !== 12) {
    hours += 12;
  } else if (period && period[0].toUpperCase() === "AM" && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

export async function getUsersSchedules(req, res) {
  const { id } = req.params;
  try {
    const scheduleData = await schedulesModel.find({ userId: id });
    return res.status(200).json(scheduleData);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving schedules", error });
  }
}

export async function deleteUserSchedule(req, res) {
  const { id } = req.params;
  try {
    const deletedUserSchedule = await schedulesModel.findByIdAndDelete(id);

    if (!deletedUserSchedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    return res.status(200).json({
      message: "Schedule successfully deleted",
      data: deletedUserSchedule,
    });
  } catch (error) {
    res.status(500).json({ message: "Error deleting schedule", error });
  }
}
