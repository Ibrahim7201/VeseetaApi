const User = require('../models/userModel');
const cloudinary = require('../utils/cloudinary');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config({ path: '../config.env' });
const { promisify } = require('util');
const AppError = require('../utils/appError');

const filterObj = (obj, ...allowedFields) => {
   const newObj = {};
   Object.keys(obj).forEach((el) => {
      if (allowedFields.includes(el)) newObj[el] = obj[el];
   });
   return newObj;
};

exports.getAllUsers = async (req, res, next) => {
   try {
      const users = await User.find({});
      res.status(201).send({ status: `Success`, data: { users } });
   } catch (err) {
      err.statusCode = 404;
      err.Code = 'Error Finding All Users';
      next(err);
   }
};
exports.delete = async function (req, res, next) {
   try {
      const userID = req.params.id;
      const users = await User.find({ _id: userID });
      if (Object.keys(users).length === 0) {
         res.status(402).json({ status: "There isn't such user" });
         next();
      } else {
         await User.deleteMany({ _id: userID });
         res.status(201).json({
            status: `Deleted ${Object.keys(users).length} users.`,
         });
         next();
      }
   } catch (err) {
      err.statusCode = 422;
      err.code = 'Error in deleting';
      next(err);
   }
};
exports.reserve = async function (req, res, next) {
   try {
      let { hours, minutes, doctor, specialization, doctor_id } = req.body;
      let token = req.cookies.jwt;
      const payLoad = await promisify(jwt.verify)(
         token,
         process.env.JWT_SECRET
      );
      const [user] = await User.find({ _id: payLoad.id });
      let userReservations = user.reservations;
      const obj = { hours, minutes, doctor, specialization, doctor_id };
      userReservations.push(obj);
      await User.findByIdAndUpdate(
         { _id: payLoad.id },
         { reservations: userReservations }
      );
      res.status(201).json({ status: 'Done Reserving' });
   } catch (err) {
      err.statusCode = 422;
      err.code = 'Error in reservation';
      next(err);
   }
};
exports.reserveCancel = async function (req, res, next) {
   try {
      let { hours, minutes } = req.body;
      let token = req.cookies.jwt;
      const payLoad = await promisify(jwt.verify)(
         token,
         process.env.JWT_SECRET
      );
      const [user] = await User.find({ _id: payLoad.id });
      let userReservations = user.reservations;
      userReservations.forEach((el, i) => {
         if (el.hours == hours && el.minutes == minutes) {
            userReservations.splice(i, 1);
         }
      });
      await User.findByIdAndUpdate(
         { _id: payLoad.id },
         { reservations: userReservations }
      );
      res.status(201).json({ status: 'Done Cancelling for User' });
   } catch (err) {
      err.statusCode = 422;
      err.code = 'Error in cancelling reservation for User';
      next(err);
   }
};
exports.getReservations = async (req, res, next) => {
   try {
      let token = req.cookies.jwt;
      const payLoad = await promisify(jwt.verify)(
         token,
         process.env.JWT_SECRET
      );
      const [user] = await User.find({ _id: payLoad.id });
      res.status(201).json({
         status: `Success`,
         data: { reservations: user.reservations },
      });
   } catch (err) {
      err.statusCode = 422;
      err.code = 'Error in getting reservations';
      next(err);
   }
};
exports.uploadImage = async function (req, res, next) {
   try {
      cloudinary.uploader.upload(req.file.path, function (err, result) {
         console.log('Error: ', err);
         console.log('Result: ', result);
         res.status(201).json({ status: `Success`, data: { url: result.url } });
      });
   } catch (err) {
      err.statusCode = 404;
      err.code = 'Error in uploading img';
      next(err);
   }
};
exports.getUserData = async (req, res, next) => {
   try {
      let token = req.cookies.jwt;
      const payLoad = await promisify(jwt.verify)(
         token,
         process.env.JWT_SECRET
      );
      const [user] = await User.find({ _id: payLoad.id });
      res.status(201).json({ status: `Success`, data: { user } });
   } catch (err) {
      err.statusCode = 500;
      err.code = "Error in getting user's data";
      next(err);
   }
};
exports.updateMe = async (req, res, next) => {
   try {
      if (req.body.password || req.body.passwordConfirmation) {
         return next(
            new AppError('This route is not for password update', 400)
         );
      }
      const filteredBody = filterObj(req.body, 'name', 'email');
      const updatedUser = await User.findByIdAndUpdate(
         req.user.id,
         filteredBody,
         {
            new: true,
            runValidators: true,
         }
      );
      console.log(updatedUser);
      res.status(200).json({
         status: 'success',
         data: {
            user: updatedUser,
         },
      });
   } catch (err) {
      next(new AppError('Error in updating data', 422));
   }
};
