import usersModel from "../models/usersModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// user login
export async function userLogin(req, res) {
  const { username, password } = req.body;

  const user = await usersModel
    .findOne({ username: username })
    .populate("departmentId");

  if (!user) {
    return res.status(200).json({ error: "User doesnt exist!" });
  }
  const isCorrectPassword = await bcrypt.compare(password, user.password);

  if (user && isCorrectPassword) {
    if (!user.approved) {
      return res.status(200).json({
        error:
          "Account not yet approved, an email will be received if approved",
      });
    }

    return res.status(200).json({
      id: user._id,
      firstname: user.firstname,
      middlename: user.middlename,
      lastname: user.lastname,
      email: user.email,
      userType: user.userType,
      suffix: user.suffix,
      departmentAcronym: user.departmentId.acronym,
      departmentName: user.departmentId.name,
      profilePicture: user.profilePicture,
      id_number: user.id_number,
      token: generateToken(user._id),
    });
  } else {
    return res.status(200).json({ error: "Incorrect password" });
  }
}

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};
