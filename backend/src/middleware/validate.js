const { AppError, StatusCodes } = require("../common/appError");

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    const issues = result.error.issues || result.error.errors || [];
    const errorDetails = issues
      .map((err) => `${err.path.join(".")}: ${err.message}`)
      .join(", ");
    return next(new AppError(errorDetails || "Validation failed", StatusCodes.BAD_REQUEST));
  }

  req.validated = result.data;
  next();
};


module.exports = validate;

