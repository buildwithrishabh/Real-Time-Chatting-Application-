const { AppError, StatusCodes } = require("../common/appError");

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    const errorDetails = result.error.errors
      .map((err) => `${err.path.join(".")}: ${err.message}`)
      .join(", ");
    return next(new AppError(errorDetails, StatusCodes.BAD_REQUEST));
  }

  req.validated = result.data;
  next();
};


module.exports = validate;

