import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import cloudinary from "cloudinary";
import morgan from "morgan";
import helmet from "helmet";
import { errorHandler, routeNotFound } from "./middlewares/errorHandler.js";
import { connectDB } from "./database/connectDB.js";
import userRouter from "./routes/userRoute.js";
dotenv.config();
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
const app = express();
const PORT = process.env.PORT || 8080;
const API_BASE = process.env.API_ENDPOINT || "/api/v1";
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: true,
    maxAge: 3600,
  })
);

app.use(morgan("dev"));
app.use(helmet());
app.use(cookieParser());

app.use(`${API_BASE}/user`, userRouter);

// Error Handling
app.use(routeNotFound);
app.use(errorHandler);

app.listen(PORT, async () => {
  await connectDB();
  console.log(`"Server is running on http://localhost:${PORT}"`);
});
