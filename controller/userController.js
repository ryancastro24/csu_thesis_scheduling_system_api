import usersModel from "../models/usersModel.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import adviserAcceptanaceModel from "../models/adviserAcceptanaceModel.js";
// get all users
export async function getUsers(req, res) {
  try {
    const users = await usersModel
      .find({ userType: { $ne: "admin" } })
      .populate("departmentId")
      .sort({ approved: 1 }); // Sort by approved field (false values first)
    return res.status(200).send(users);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
}

export async function getAllRequestingUsers(req, res) {
  try {
    const users = await usersModel.find({ approved: false });

    return res.status(200).send(users);
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
}

// add new user
export async function addUser(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const userExist = await usersModel.findOne({ username });
    const emailExist = await usersModel.findOne({ email });

    if (userExist) {
      return res.status(200).json({ message: "User already exists" });
    }

    if (emailExist) {
      return res.status(200).json({ message: "Email already exists!" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await usersModel.create({
      ...req.body,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: "User added successfully",
      userId: newUser._id,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error adding user", error: error.message });
  }
}

// delete user
export async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    const user = await usersModel.findById(id);

    if (!user) {
      return res.status(404).send({ error: "User not found!" });
    }

    const deletedUserData = await usersModel.findByIdAndDelete(id);

    return res
      .status(200)
      .send({ message: "User deleted successfully", data: deletedUserData });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error deleting user", error: error.message });
  }
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

export async function approvedUser(req, res) {
  try {
    const { id } = req.params;

    const updatedUser = await usersModel.findByIdAndUpdate(
      id,
      { $set: { approved: true } },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // // // Send approval email to user
    // // const transporter = nodemailer.createTransport({
    // //   service: process.env.EMAIL_SERVICE,
    // //   auth: {
    // //     user: process.env.EMAIL_USER,
    // //     pass: process.env.EMAIL_PASSWORD,
    // //   },
    // // });

    // // const mailOptions = {
    // //   from: `"CCIS Thesis Scheduling System" <noreply@ccis-scheduling.com>`,
    // //   to: updatedUser.email,
    // //   subject: "Account Approval Notification",
    // //   html: `
    // //     <h1>Account Approved</h1>
    // //     <p>Dear ${updatedUser.firstname || "User"},</p>
    // //     <p>Your account has been approved. You can now access all features of our platform.</p>
    // //     <p>Thank you for your patience.</p>
    // //     <p>Best regards,</p>
    // //     <p>CCIS Thesis Scheduling Admin Team</p>
    // //   `,
    // // };

    // try {
    //   await transporter.sendMail(mailOptions);
    //   console.log(`Email sent successfully to ${updatedUser.email}`);
    // } catch (emailError) {
    //   console.error("Failed to send email:", emailError);
    // }

    res
      .status(200)
      .json({ message: "User approved successfully", updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

export async function getStudents(req, res) {
  try {
    // Step 1: Get all adviserAcceptance records
    const adviserAcceptances = await adviserAcceptanaceModel.find(
      {},
      "student1Id student2Id student3Id status"
    );

    // Collect student IDs grouped by status
    const pendingIds = adviserAcceptances
      .filter((a) => a.status === "pending")
      .flatMap((a) => [a.student1Id, a.student2Id, a.student3Id])
      .filter(Boolean);

    const rejectedIds = adviserAcceptances
      .filter((a) => a.status === "reject")
      .flatMap((a) => [a.student1Id, a.student2Id, a.student3Id])
      .filter(Boolean);

    const allAssignedIds = adviserAcceptances
      .flatMap((a) => [a.student1Id, a.student2Id, a.student3Id])
      .filter(Boolean);

    // Step 2: Find students who match:
    // - have pending adviserAcceptance
    // - OR have rejected adviserAcceptance
    // - OR have no adviserAcceptance at all
    const students = await usersModel.find({
      userType: "student",
      $or: [
        { _id: { $in: pendingIds } }, // ✅ pending
        { _id: { $in: rejectedIds } }, // ✅ rejected
        { _id: { $nin: allAssignedIds } }, // ✅ not yet assigned
      ],
    });

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

export async function updateUserProfile(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.params.id;

    // Find the user
    const user = await usersModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If passwords are provided, verify and update password
    if (oldPassword && newPassword) {
      // Verify old password
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        return res.status(200).json({ error: "Old password is incorrect" });
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update user profile with new password and profile picture if file exists
      const updateData = {
        password: hashedPassword,
      };

      if (req.file) {
        updateData.profilePicture = req.file.path;
      }

      const updatedUser = await usersModel.findByIdAndUpdate(
        userId,
        updateData,
        { new: true }
      );

      return res.status(200).json({
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } else if (req.file) {
      // Only update profile picture if file exists
      const updatedUser = await usersModel.findByIdAndUpdate(
        userId,
        {
          profilePicture: req.file.path,
        },
        { new: true }
      );

      return res.status(200).json({
        message: "Profile picture updated successfully",
        user: updatedUser,
      });
    } else {
      return res.status(400).json({
        message: "No updates provided",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Error updating profile",
      error: error.message,
    });
  }
}

export async function getUserProfile(req, res) {
  try {
    const userId = req.params.id;
    const user = await usersModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({
      message: "Error retrieving user profile",
      error: error.message,
    });
  }
}

export async function sendOTP(req, res) {
  try {
    const { email } = req.body;
    // Send approval email to user
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    // Find user by email
    const user = await usersModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Store OTP in user document with expiry time (5 minutes)
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now
    await user.save();

    // Send email with OTP
    const mailOptions = {
      from: `"CCIS Thesis Scheduling System" <noreply@ccis-scheduling.com>`,
      to: user.email,
      subject: "Password Reset OTP",
      html: `
        <h1>Password Reset OTP</h1>
        <p>Your OTP for password reset is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 5 minutes.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      message: "OTP sent successfully to your email",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error sending OTP",
      error: error.message,
    });
  }
}

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Find user by email
    const user = await usersModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP exists and hasn't expired
    if (!user.otp || !user.otpExpiry) {
      return res
        .status(400)
        .json({ message: "No OTP found. Please request a new one." });
    }

    if (user.otpExpiry < new Date()) {
      return res
        .status(400)
        .json({ message: "OTP has expired. Please request a new one." });
    }

    // Verify OTP
    if (user.otp !== parseInt(otp)) {
      return res
        .status(400)
        .json({ message: "Invalid OTP. Please try again." });
    }

    // Clear OTP and expiry after successful verification
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    console.log("Successfully verified OTP");
    return res.status(200).json({
      message: "OTP verified successfully",
      verified: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error verifying OTP",
      error: error.message,
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Find user by email
    const user = await usersModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      message: "Password changed successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error changing password",
      error: error.message,
    });
  }
};
