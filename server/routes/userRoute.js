import express from "express";
import {
  loginCtrl,
  registerCtrl,
  updateUserCtrl,
} from "../controllers/userCtrl.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { singleUpload } from "../utils/multer.js";
const userRouter = express.Router();
userRouter.post("/register", registerCtrl);
userRouter.post("/login", loginCtrl);
userRouter.put("/update", authMiddleware, singleUpload, updateUserCtrl);

export default userRouter;
