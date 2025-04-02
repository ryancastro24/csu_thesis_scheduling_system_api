import usersModel from "../models/usersModel.js";
import bcrypt from "bcryptjs";

// get all users

export async function getUsers(req, res) {
  const users = await usersModel.find().populate("departmentId");
  return res.status(200).send(users);
}

// add new user
export async function addUser(req, res) {
  const userExist = await usersModel.findOne({ username: req.body.username });

  if (userExist) {
    return res.status(200).send({ error: "Username already exist!" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  const newUser = await usersModel.create({
    ...req.body,
    password: hashedPassword,
  });

  return res.status(200).send({
    message: `User added successfully`,
    data: newUser,
  });
}

// delete user
export async function deleteUser(req, res) {
  const { id } = req.params;

  const user = await usersModel.findById(id);

  if (!user) {
    return res.status(200).send({ error: "User not found!" });
  }

  const deletedUserData = await usersModel.findByIdAndDelete(id);

  return res
    .status(200)
    .send({ message: "User deleted successfully", data: deletedUserData });
}

// update user details
export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    let updates = req.body;

    const updatedUser = await usersModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully", updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

export async function getStudents(req, res) {
  try {
    const students = await usersModel.find({ userType: "student" });

    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

export async function getfaculty(req, res) {
  try {
    const faculty = await usersModel.find({ userType: "faculty" });

    res.status(200).json(faculty);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

export async function getChairpersons(req, res) {
  try {
    const chairpersons = await usersModel.find({ userType: "chairperson" });

    res.status(200).json(chairpersons);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}
