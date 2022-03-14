const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config({ path: '../config.env' });

const sendEmail = async (options) => {
   //1-create a transporter
   const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
         user: 'dd7rrwbq7nplac3c@ethereal.email',
         pass: 'xHSM9d4ygyb4cDNqYB',
      },
   });
   //2-Define email OPTIONS
   const mailOptions = {
      from: 'Ibrahim Abdelazim <ibrahimabdelazim@yahoo.com>',
      to: options.email,
      subject: options.subject,
      text: options.message,
   };

   //3-Actually send the email
   await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
