const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });
const { promisify } = require("util");

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
    const payLoad = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const freshUser = await User.findById(payLoad.id);
    if (!freshUser) {
      return next("User belongs to this token no longer exists");
    }
    if (freshUser.changedPasswordAfter(payLoad.iat)) {
      return next(`User changed password after the token was issued`);
    }
    req.user = freshUser;
    next();
  } catch (err) {
    err.statusCode = 404;
    err.code = "Error in Authintication";
    next(err);
  }
};

exports.signup = async (req, res, next) => {
  try {
    const { name, image, password, email, passwordConfirmation, passwordChangedAt, role, phones } = req.body;
    const user = await User.find({ email });
    if (user[0]) throw new Error("User Exists");
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
    if (!email || !password) {
      return res.json({ status: "error missing parameter" });
    }
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.correctPassword(password, user.password))) {
      return next("Incorrect Password or email", 400);
    }
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

exports.forgetPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(`There is no user with this email address`);
    }
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    res.send("Done");
  } catch (err) {}
};
exports.resetPassword = async (req, res, next) => {};
