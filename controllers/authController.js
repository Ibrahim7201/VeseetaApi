const crypto = require('crypto');
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config({ path: '../config.env' });
const { promisify } = require('util');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const signToken = (id, role) => {
   return jwt.sign({ id, role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES,
   });
};

const sendToken = (user, statusCode, res) => {
   const token = signToken(user._id, user.role);
   const cookieOption = {
      expires: new Date(
         Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
   };
   if (process.env.NODE_ENV === 'production') {
      cookieOption.secure = true;
   }
   res.cookie('jwt', token, cookieOption);

   user.password = undefined;
   res.status(statusCode).json({
      status: 'success',
      token,
      data: {
         user,
      },
   });
};

exports.protect = async (req, res, next) => {
   try {
      let token;
      if (
         req.headers.authorization &&
         req.headers.authorization.startsWith('Bearer')
      ) {
         token = req.headers.authorization.split(' ')[1];
      } else if (req.cookies.jwt) {
         console.log(req.cookies.jwt);
         token = req.cookies.jwt;
      }
      if (!token) {
         return next(`User is not logged in please login first`);
      }
      const payLoad = await promisify(jwt.verify)(
         token,
         process.env.JWT_SECRET
      );

      const freshUser = await User.findById(payLoad.id);
      if (!freshUser) {
         return next('User belongs to this token no longer exists');
      }
      if (freshUser.changedPasswordAfter(payLoad.iat)) {
         return next(`User changed password after the token was issued`);
      }
      req.user = freshUser;
      next();
   } catch (err) {
      next(new AppError(`Error in Authentication`, 404));
   }
};

exports.signup = async (req, res, next) => {
   try {
      const {
         name,
         image,
         password,
         email,
         passwordConfirmation,
         passwordChangedAt,
         role,
         phones,
      } = req.body;
      const user = await User.find({ email });
      if (user[0]) next(new AppError('User Exists', 422));
      //alternate to const newUser= new User({####})
      //newUser.save().
      const newUser = await User.create({
         name,
         image,
         password,
         email,
         passwordConfirmation,
         passwordChangedAt,
         role,
         phones,
      });
      await res.cookie('name', newUser.name.toString(), {
         expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
         ),
      });
      sendToken(newUser, 201, res);
   } catch (err) {
      next(new AppError(`Error in Signing Up`, 404));
   }
};

exports.login = async (req, res, next) => {
   try {
      const { email, password } = req.body;
      if (!email || !password) {
         return res.status(422).json({
            status: 'fail',
            message: 'invalid parameter',
         });
      }
      const user = await User.findOne({
         email,
      }).select('+password');

      if (!user || !(await user.correctPassword(password, user.password))) {
         return next(new AppError('Incorrect Password or email', 400));
      }
      const userName = user.name.toString();
      res.cookie('name', userName, {
         expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
         ),
      });
      // console.log(req.cookies);
      sendToken(user, 201, res);
   } catch (err) {
      next(new AppError('Error in Loging in', 404));
   }
};

exports.logout = async (req, res, next) => {
   try {
      res.cookie('jwt', '', {
         expires: new Date(Date.now() - 1000000),
         httpOnly: true,
      });
      res.cookie('name', 'Logged-out', {
         expires: new Date(Date.now() - 1000000),
      });

      res.json('You are logged out');
   } catch (err) {
      next(new AppError(`Can't LogOut`, 505));
   }
};

exports.restrictTo = (...roles) => {
   return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
         return next(
            new AppError(
               "You don't have permission to access this acction",
               402
            )
         );
      }
      next();
   };
};

exports.forgetPassword = async (req, res, next) => {
   //1-get user based on email
   const user = await User.findOne({
      email: req.body.email,
   });
   if (!user) {
      return next(
         new AppError(`There is no user with this email address`, 422)
      );
   }
   //2-generate the random reset token
   const resetToken = await user.createPasswordResetToken();
   await user.save({
      validateBeforeSave: false,
   });
   //3-send it to user's email
   const resetURL = `${req.protocol}://${req.get(
      'host'
   )}/reset-password/${resetToken}. \nIf you didin't forget your password
       please ignore this email`;
   const message = `Forgot your password? Submit a PATCH 
      request with your new password and passwordConfirmation to: ${resetURL}`;
   try {
      await sendEmail({
         email: req.body.email,
         subject: `Your password reset token (valid for 10 min)`,
         message,
      });
      res.status(201).json({
         status: 'Success',
         message: `Token sent to email! ✔`,
      });
   } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return next(
         new AppError(
            'There was an error sending the email. Try again later.',
            500
         )
      );
   }
};

exports.resetPassword = async (req, res, next) => {
   try {
      //1) Get user based on token
      const hashedToken = crypto
         .createHash('sha256')
         .update(req.params.token)
         .digest('hex');
      const user = await User.findOne({
         passwordResetToken: hashedToken,
         passwordResetExpires: { $gt: Date.now() },
      });
      if (!user) return next(new AppError(`Token has expired!`, 400));
      user.password = req.body.password;
      user.passwordConfirmation = req.body.passwordConfirmation;
      user.passwordResetExpires = undefined;
      user.passwordResetToken = undefined;
      await user.save();
      //2) if token has not expired, and there is user, set the new password
      //3) Update changedPasswordAt property for the user
      //4) Log the user in, send JWT
      const token = signToken(user._id);
      res.status(200).json({
         status: 'success',
         token,
      });
   } catch (err) {
      next(new AppError('Failed to reset password', 422));
   }
};

exports.updatePassword = async (req, res, next) => {
   try {
      //1) get user from collection
      const user = await User.findById(req.user._id).select('+password');
      //2) check if posted current password
      if (
         !(await user.correctPassword(req.body.currentPassword, user.password))
      ) {
         return next(new AppError(`Your current password is wrong!`, 401));
      }
      //3) if so, update password
      user.password = req.body.password;
      user.passwordConfirmation = req.body.passwordConfirmation;
      await user.save();
      //4) log user in, send JWT
      sendToken(user, 200, res);
   } catch (err) {
      next(new AppError(`Error in updating password`, 422));
   }
};
