const AppError = require('../utils/appError');
const handleCastErrorDB = (err) => {
   return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
};
const handleValidationErrorDB = (err) => {
   const errors = Object.values(err.errors).map((el) => el.message);
   const message = `Invalid input Data. ${errors.join('. ')}`;
   return new AppError(message, 400);
};
const sendError = (err, res) => {
   res.status(err.statusCode).json({
      status: err.status,
      error: err,
   });
};
module.exports = async function (err, req, res, next) {
   err.statusCode = err.statusCode || 500;
   err.status = err.status || 'error';
   let error = { ...err };
   error.message = err.message;
   if (error.name === 'CastError') error = handleCastErrorDB(error);
   if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
   sendError(error, res);
};
