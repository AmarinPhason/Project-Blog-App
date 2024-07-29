import jwt from "jsonwebtoken";
import { User } from "../models/userModel.js";
import { AppError } from "../middlewares/errorHandler.js";

export const authMiddleware = async (req, res, next) => {
  const token = req.cookies.access_token;
  try {
    if (!token) {
      return next(new AppError("Unauthorized", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded._id);

    if (!req.user) {
      return next(new AppError("Unauthorized", 401));
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const adminMiddleware = async (req, res, next) => {
  const isAdmin = req.user.isAdmin;
  try {
    if (!isAdmin) {
      return next(new AppError("Admin access only", 401));
    }
    next();
  } catch (error) {
    next(error);
  }
};
