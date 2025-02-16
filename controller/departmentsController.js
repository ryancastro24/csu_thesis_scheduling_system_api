import departments from "../models/deparmentModel.js";

export async function getDepartments(req, res) {
  const departmentsData = await departments.find();
  return res.status(200).send(departmentsData);
}

export async function addDepartment(req, res) {
  const newDepartment = await departments.create(req.body);
  return res.status(200).send(newDepartment);
}
