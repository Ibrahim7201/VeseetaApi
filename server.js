const mongoose = require('mongoose');
const helmet = require('helmet');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const express = require('express');
const app = express();
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const port = process.env.PORT || 3000;
const cors = require('cors');
const router = require('./routers/Router');
const cookieParser = require('cookie-parser');

const onlineDB = process.env.DATABASE.replace(
   '<PASSWORD>',
   process.env.DATABASE_PASSWORD
);
const localDB = process.env.DATABASE_LOCAL;

main();
async function main() {
   try {
      await mongoose.connect(localDB);
   } catch (err) {
      console.log(err.message);
   }
}

app.use(function (req, res, next) {
   res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
   res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, OPTIONS, PUT, PATCH, DELETE'
   );
   res.setHeader(
      'Access-Control-Allow-Headers',
      'X-Requested-With,content-type'
   );
   res.setHeader('Access-Control-Allow-Credentials', true);
   next();
});
const limiter = rateLimit({
   max: 100,
   windowMs: 60 * 60 * 1000,
   message: `Too many requests from this IP, please try again in an hour`,
});

app.use('/', limiter);

//data from body added to request object
app.use(express.json());
//Data Sanitize against NoSQL Attacks
// app.use(mongoSanitize());
//Data Sanitize againse XSS Attacks
// app.use(xss());
//Prevent parameter pollution
// app.use(
//    hpp({
//       whitelist: ['duration', 'price'],
//    })
// );
app.use(cookieParser());
app.use(express.urlencoded());
app.use(helmet());
app.use(express.static(`${__dirname}/public`));
if (process.env.NODE_ENV === 'development') {
   app.use(morgan('tiny'));
}
app.use('/', router);

// process.on('uncaughtException', (err) => {
//    console.log(`UNCAUGHT EXCEPTION! 💥Shutting down ..`);
//    console.log(err.name, ': ', err.message);
//    server.close(() => {
//       process.exit(1);
//    });
// });

const server = app.listen(port, () => {
   console.log(`Veseeta app listening on port ${port}`);
});
