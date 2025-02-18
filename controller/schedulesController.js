import schedules from "../models/schedule.js";

// get user schedule
export async function getUserSchedules(req, res) {
  const { id } = req.params;
  const userSchedules = await schedules.find({ userId: id });

  if (!userSchedules) {
    return res.status(200).send({ error: "User not found" });
  }

  return res.status(200).send(userSchedules);
}

// add new schedule
export async function addNewSchedules(req, res) {
  const { title, date, userId } = req.body;

  if (!title || !date || !userId) {
    return res.status(400).send({ error: "Missing Fields" });
  }
  const newSchedule = await schedules.create(req.body);

  return res.status(200).send(newSchedule);
}

// delete schedule
export async function deleteSchedule(req, res) {
  const { id } = req.params;

  const schedule = await schedules.findById(id);

  if (!schedule) {
    return res.status(400).send({ error: "Schedule not found" });
  }
  const deletedSchedule = await schedules.findByIdAndDelete(id);

  return res.status(200).send(deletedSchedule);
}
