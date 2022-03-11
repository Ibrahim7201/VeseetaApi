const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config({ path: "../config.env" });
const sendEmail = (options) => {
  //1-create a transporter
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "sadsad",
    },
  });
  //2-Define email OPTIONS
  //3-Actually send the email
};
