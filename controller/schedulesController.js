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
      panel1,
      panel2,
      panel3,
      panel4,
      chairperson,
      eventType,
    } = req.body;

    const adminId = new mongoose.Types.ObjectId("67d1534860798a27a35b0cc9");

    if (!dateRange || !panel1 || !panel2 || !panel3 || !chairperson) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Default working hours (excluding lunch)
    const defaultTimeRanges = [
      { start: "08:00", end: "11:00" },
      { start: "13:00", end: "17:00" },
    ];

    const userIds = [panel1, panel2, panel3, panel4, chairperson, adminId];

    const allSchedules = await schedulesModel.find({
      userId: { $in: userIds },
    });

    const [startDate, endDate] = dateRange
      .split(" - ")
      .map((date) => new Date(date.trim()));

    const availableDates = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Check if the current date is a weekday (Monday to Friday)
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // 0 = Sunday, 6 = Saturday
        availableDates.push(currentDate.toISOString().split("T")[0]);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Group schedules by date for faster lookup
    const schedulesByDate = {};
    allSchedules.forEach((sched) => {
      if (!schedulesByDate[sched.date]) {
        schedulesByDate[sched.date] = [];
      }
      if (sched.time) {
        const [start, end] = sched.time.split(" - ").map((t) => t.trim());
        schedulesByDate[sched.date].push({
          start: convertTo24Hour(start),
          end: convertTo24Hour(end),
        });
      }
    });

    const generateTimeSlots = (rangeStart, rangeEnd) => {
      const slots = [];
      let current = new Date(`1970-01-01T${rangeStart}:00Z`);
      const end = new Date(`1970-01-01T${rangeEnd}:00Z`);
      while (new Date(current.getTime() + 2 * 60 * 60 * 1000) <= end) {
        const endSlot = new Date(current.getTime() + 2 * 60 * 60 * 1000);
        slots.push({
          start: current.toISOString().substring(11, 16),
          end: endSlot.toISOString().substring(11, 16),
        });
        current = new Date(current.getTime() + 30 * 60 * 1000); // move 30 mins for more possibilities
      }
      return slots;
    };

    const finalSlots = [];

    for (const date of availableDates) {
      let booked = schedulesByDate[date] || [];

      defaultTimeRanges.forEach(({ start, end }) => {
        const timeSlots = generateTimeSlots(start, end);

        timeSlots.forEach((slot) => {
          const slotStart = new Date(`1970-01-01T${slot.start}:00Z`);
          const slotEnd = new Date(`1970-01-01T${slot.end}:00Z`);

          const overlaps = booked.some((b) => {
            const bookedStart = new Date(`1970-01-01T${b.start}:00Z`);
            const bookedEnd = new Date(`1970-01-01T${b.end}:00Z`);
            return slotStart < bookedEnd && slotEnd > bookedStart;
          });

          if (!overlaps) {
            finalSlots.push({
              date,
              time: `${formatTo12Hour(slot.start)} - ${formatTo12Hour(
                slot.end
              )}`,
            });
          }
        });
      });
    }

    if (finalSlots.length === 0) {
      return res.status(200).json({
        message: `No available time slots found.`,
      });
    }

    return res.status(200).json({ data: finalSlots });
  } catch (error) {
    console.error("Error generating schedule:", error);
    return res.status(500).json({ message: "Server error", error });
  }
};
function formatTo12Hour(time24) {
  const [hour, minute] = time24.split(":").map(Number);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute.toString().padStart(2, "0")}${ampm}`;
}
// Converts 12-hour format to 24-hour
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
export async function verifyScheduleConflict(req, res) {
  const { date, time, panel1, panel2, panel3, panel4 } = req.body;
  const panelIds = [panel1, panel2, panel3, panel4];

  const [startTime, endTime] = time.split(" - ").map(convertTo24Hour);

  try {
    // Fetch all schedules for the specified panels
    const conflictingSchedules = await schedulesModel.find({
      date: date,
      userId: { $in: panelIds },
    });

    // Check for conflicts based on the time and date
    const conflicts = conflictingSchedules.some((sched) => {
      const bookedStart = convertTo24Hour(sched.time.split(" - ")[0]);
      const bookedEnd = convertTo24Hour(sched.time.split(" - ")[1]);
      const isSameDate = sched.date === date; // Ensure the date matches
      return (
        isSameDate &&
        ((startTime < bookedEnd && endTime > bookedStart) || // Overlap case
          (startTime <= bookedStart && endTime >= bookedEnd)) // Full overlap case
      );
    });

    if (conflicts) {
      return res.status(200).json({
        message: "Schedule conflict detected",
      });
    }

    return res.status(200).json({ message: "No conflicts detected" });
  } catch (error) {
    console.log({ message: "Error verifying schedule", error });
    res.status(500).json({ message: "Error verifying schedule", error });
  }
}

export async function updateSchedule(req, res) {
  const { id } = req.params; // Get schedule ID from request params
  const { eventType, date, time } = req.body; // Get new event type, date, and time from request body

  try {
    // Ensure the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid schedule ID" });
    }

    // Update only the eventType, date, and time fields
    const updatedSchedule = await schedulesModel.findByIdAndUpdate(
      id,
      { eventType, date, time },
      { new: true, fields: { eventType: 1, date: 1, time: 1 } } // Return only updated fields
    );

    if (!updatedSchedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    res.status(200).json({
      message: "Schedule updated successfully",
      data: updatedSchedule,
    });
  } catch (error) {
    console.error("Error updating schedule:", error);
    res.status(500).json({ message: "Error updating schedule", error });
  }
}
