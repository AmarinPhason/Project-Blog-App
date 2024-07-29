export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const routeNotFound = (req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} Not Found`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // For unexpected errors, don't leak error details in production
    const message =
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : err.message;

    res.status(500).json({
      status: "error",
      message: message,
      stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    });
  }
};
