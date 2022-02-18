const User = require("./userModel");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const { promisify } = require("util");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_SECRET,
});
const streamifier = require("streamifier");
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOption = {
    expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") {
    cookieOption.secure = true;
  }
  res.cookie("jwt", token, cookieOption);

  //Removing Password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.protect = async (req, res, next) => {
  //1:Get token and check if it is correct
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      console.log(req.cookies.jwt);
      token = req.cookies.jwt;
    }
    if (!token) {
      return next(`User is not logged in please login first`);
    }
    //2:Verification token
    const payLoad = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    //3:Check if user still exists

    const freshUser = await User.findById(payLoad.id);
    if (!freshUser) {
      return next("User belongs to this token no longer exists");
    }
    //4:Check if user changed password after the token was issued
    if (freshUser.changedPasswordAfter(payLoad.iat)) {
      return next(`User changed password after the token was issued`);
    }
    //Grant access to protected route
    req.user = freshUser;
    next();
  } catch (err) {
    err.statusCode = 404;
    err.code = "Error in Authintication";
    next(err);
  }
};
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
exports.signup = async (req, res, next) => {
  try {
    const { name, image, password, email, passwordConfirmation, passwordChangedAt, role, phones } = req.body;
    const newUser = await User.create({ name, image, password, email, passwordConfirmation, passwordChangedAt, role, phones });
    res.cookie("name", newUser.name.toString(), {
      expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
    });
    createSendToken(newUser, 201, res);
  } catch (err) {
    err.statusCode = 404;
    err.code = "Error in Signing Up";
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    //1:Check if email and password exist
    if (!email || !password) {
      return res.json({ status: "error missing parameter" });
    }
    //2:Check if user exists && password is correct
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next("Incorrect Password or email", 400);
    }
    //3:Everything OK? send token to client
    const userName = user.name.toString();
    res.cookie("name", userName, {
      expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000),
    });
    createSendToken(user, 201, res);
  } catch (err) {
    err.statusCode = 404;
    err.code = "Error in Loging in";
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    res.cookie("jwt", "", {
      expires: new Date(Date.now() - 1000000),
      httpOnly: true,
    });
    res.cookie("name", "Logged-out", {
      expires: new Date(Date.now() - 1000000),
    });

    res.json("You are logged out");
  } catch (err) {
    err.statusCode = 505;
    err.Code = "Can't LogOut";
    next(err);
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next("You don't have permission to access this acction");
    }
    next();
  };
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
