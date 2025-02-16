import usersModel from "../models/usersModel.js";
import bcrypt from "bcryptjs";

// get all users

export async function getUsers(req, res) {
  const users = await usersModel
    .find()
    .populate("collegeId")
    .populate("departmentId");

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

  return res.status(200).send(newUser);
}

// delete user
export async function deleteUser(req, res) {
  const { id } = req.params;

  const user = await usersModel.findById(id);

  if (!user) {
    return res.status(200).send({ error: "User not found!" });
  }

  const deletedUserData = await usersModel.findByIdAndDelete(id);

  return res.status(200).send(deletedUserData);
}

// update user details
export async function updateUser(req, res) {
  try {
    const { id } = req.params;
    let updates = req.body;

    // If a password is provided and is not an empty string, hash it
    if (updates.password && updates.password.trim() !== "") {
      const saltRounds = 10;
      updates.password = await bcrypt.hash(updates.password, saltRounds);
    } else {
      // Remove password from updates to keep the existing one
      delete updates.password;
    }

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
