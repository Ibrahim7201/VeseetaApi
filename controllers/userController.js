const User = require("../models/userModel");
const cloudinary = require("../utils/cloudinary");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });
const { promisify } = require("util");

exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (err) {
    err.statusCode = 404;
    err.Code = "Error Finding All Users";
    next(err);
  }
};
exports.delete = async function (req, res, next) {
  try {
    const userID = req.params.id;
    const users = await User.find({ _id: userID });
    if (Object.keys(users).length === 0) {
      res.json({ message: "There isn't such user" });
      next();
    } else {
      await User.deleteMany({ _id: userID });
      res.json(`Deleted ${Object.keys(users).length} users.`);
      next();
    }
  } catch (err) {
    err.statusCode = 422;
    err.code = "Error in deleting";
    next(err);
  }
};
exports.reserve = async function (req, res, next) {
  try {
    let { hours, minutes, doctor, specialization, doctor_id } = req.body;
    let token = req.cookies.jwt;
    const payLoad = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const [user] = await User.find({ _id: payLoad.id });
    let userReservations = user.reservations;
    const obj = { hours, minutes, doctor, specialization, doctor_id };
    userReservations.push(obj);
    await User.findByIdAndUpdate({ _id: payLoad.id }, { reservations: userReservations });
    res.json("Done Reserving");
  } catch (err) {
    err.statusCode = 422;
    err.code = "Error in reservation";
    next(err);
  }
};
exports.reserveCancel = async function (req, res, next) {
  try {
    let { hours, minutes } = req.body;
    let token = req.cookies.jwt;
    const payLoad = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const [user] = await User.find({ _id: payLoad.id });
    let userReservations = user.reservations;
    userReservations.forEach((el, i) => {
      if (el.hours == hours && el.minutes == minutes) {
        userReservations.splice(i, 1);
      }
    });
    await User.findByIdAndUpdate({ _id: payLoad.id }, { reservations: userReservations });
    res.json("Done Cancelling for User");
  } catch (err) {
    err.statusCode = 422;
    err.code = "Error in cancelling reservation for User";
    next(err);
  }
};
exports.getReservations = async (req, res, next) => {
  try {
    let token = req.cookies.jwt;
    const payLoad = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const [user] = await User.find({ _id: payLoad.id });
    res.json(user.reservations);
  } catch (err) {
    err.statusCode = 422;
    err.code = "Error in getting reservations";
    next(err);
  }
};
exports.uploadImage = async function (req, res, next) {
  try {
    cloudinary.uploader.upload(req.file.path, function (err, result) {
      console.log("Error: ", err);
      console.log("Result: ", result);
      res.json(result.url);
    });
  } catch (err) {
    err.statusCode = 404;
    err.code = "Error in uploading img";
    next(err);
  }
};
exports.getUserData = async (req, res, next) => {
  try {
    let token = req.cookies.jwt;
    const payLoad = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const [user] = await User.find({ _id: payLoad.id });
    res.json(user);
  } catch (err) {
    err.statusCode = 500;
    err.code = "Error in getting user's data";
    next(err);
  }
};
exports.getMyRole = async (req, res, next) => {
  try {
    let token = req.cookies.jwt;
    const payLoad = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const [user] = await User.find({ _id: payLoad.id });
    res.json(user.role);
  } catch (err) {
    err.statusCode = 500;
    err.code = "Error in getting user's data";
    next(err);
  }
};
