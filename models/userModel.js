const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
dotenv.config({ path: '../config.env' });
let userSchemaOptions = {
  toJSON: {
    virtuals: true,
  },
};
const userSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: true,
      default: 'assets/default.png',
    },
    name: {
      type: String,
      required: [true, 'Please enter your name'],
    },
    phones: [
      {
        area: {
          type: String,
        },
        prefix: {
          type: String,
        },
        line: {
          type: String,
        },
      },
    ],
    reservations: [
      {
        hours: {
          type: Number,
          min: 0,
          max: 24,
          required: true,
        },
        minutes: {
          type: Number,
          min: 0,
          max: 60,
          required: true,
        },
        doctor: {
          type: String,
          required: true,
        },
        specialization: {
          type: String,
          required: true,
        },
        doctor_id: {
          type: String,
          required: true,
        },
      },
    ],
    email: {
      type: String,
      required: [true, 'Please enter your email'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please enter your password'],
      minLength: 8,
      select: false,
    },
    passwordConfirmation: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords are not the same!',
      },
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: {
      type: Date,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      required: [true, 'Please enter your role'],
      default: 'user',
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
  },
  userSchemaOptions
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, +process.env.SALT_ROUNDS);
  this.passwordConfirmation = undefined;
  next();
});

userSchema.methods.correctPassword = async function (
  enteredPassword,
  userPassword
) {
  return await bcrypt.compare(enteredPassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimeStamp < changedTimeStamp;
  }
  return false;
};
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  console.log({ resetToken }, this.passwordResetToken);
  return resetToken;
};
const User = mongoose.model('User', userSchema);
module.exports = User;
