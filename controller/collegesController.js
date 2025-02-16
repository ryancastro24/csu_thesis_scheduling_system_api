import colleges from "../models/collegeModel.js";
export async function getColleges(req, res) {
  const collegesData = await colleges.find();

  return res.status(200).send(collegesData);
}

export async function addCollege(req, res) {
  const newCollege = await colleges.create(req.body);

  return res.status(200).send(newCollege);
}
