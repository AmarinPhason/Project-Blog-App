import { AppError } from "../middlewares/errorHandler.js";
import { User } from "../models/userModel.js";
import { setCookieOptions } from "../utils/cookieOptions.js";
import { getDataUri } from "../utils/feature.js";
import cloudinary from "cloudinary";
export const registerCtrl = async (req, res, next) => {
  const { username, email, password } = req.body;
  try {
    if (!username || !email || !password) {
      return next(new AppError("Please enter all fields", 400));
    }

    const findUser = await User.findOne({ email });
    if (findUser) {
      return next(new AppError("Email already exists", 400));
    }
    const findUsername = await User.findOne({ username });
    if (findUsername) {
      return next(new AppError("Username already exists", 400));
    }
    const newUser = await User.create({ username, email, password });
    const { password: _password, ...otherDetails } = newUser._doc;
    res.status(201).json({
      message: "User created successfully",
      data: otherDetails,
    });
  } catch (error) {
    next(error);
  }
};

export const loginCtrl = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return next(new AppError("Please enter all fields", 400));
    }
    const findUser = await User.findOne({ email });
    if (!findUser) {
      return next(new AppError("Email does not exist", 400));
    }
    const isMatch = await findUser.comparePassword(password);
    if (!isMatch) {
      return next(new AppError("Invalid password", 400));
    }
    const { password: _password, ...otherDetails } = findUser._doc;
    const token = findUser.generateToken();
    res.status(200).cookie("access_token", token, setCookieOptions()).json({
      message: "Login successful",
      data: otherDetails,
      token,
    });
  } catch (error) {
    next(error);
  }
};

// controller.js
export const googleLoginCtrl = async (req, res, next) => {
  const { email, displayName, photoURL } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      const token = user.generateToken();
      return res
        .status(200)
        .cookie("access_token", token, setCookieOptions())
        .json({
          message: "Login successful",
          data: user,
          token,
        });
    }

    if (!user) {
      user = new User({
        username: displayName,
        password: email + process.env.JWT_SECRET,
        email,
        picture: { url: photoURL },
      });

      await user.save();
    }

    const token = user.generateToken();
    res.status(200).cookie("access_token", token, setCookieOptions()).json({
      message: "Login successful",
      data: user,
      token,
    });
  } catch (error) {
    console.error("Error during Google login:", error); // เพิ่มการ log error
    next(error);
  }
};

export const logoutCtrl = async (req, res, next) => {
  try {
    res
      .status(200)
      .clearCookie("access_token", setCookieOptions())
      .json({ message: "Logout successful" });
  } catch (error) {
    next(error);
  }
};

export const updateUserCtrl = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // อัปเดตข้อมูลโปรไฟล์ผู้ใช้
    user.username = req.body.username || user.username;

    // ตรวจสอบและอัปเดตรหัสผ่านหากมีการส่ง oldPassword และ newPassword
    if (req.body.oldPassword && req.body.newPassword) {
      const isMatch = await user.matchPassword(req.body.oldPassword);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid old password" });
      }
      user.password = req.body.newPassword;
    }

    // ตรวจสอบและอัปโหลดรูปภาพ
    if (req.file) {
      const file = getDataUri(req.file);

      // ตรวจสอบว่า public_id มีค่าอยู่
      if (user.profilePicture.public_id) {
        await cloudinary.v2.uploader.destroy(user.profilePicture.public_id);
      } else {
        console.log("No previous image to delete.");
      }

      const cdb = await cloudinary.v2.uploader.upload(file.content);
      user.profilePicture = {
        public_id: cdb.public_id,
        url: cdb.secure_url,
      };
    }

    const updatedUser = await user.save();
    const { password: p, ...others } = updatedUser._doc;
    res.status(200).json({
      message: "User updated successfully",
      data: { ...others },
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    // เข้าถึงข้อมูลผู้ใช้จาก req.user (ที่ได้จาก authMiddleware)
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Get profile successfully",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};
