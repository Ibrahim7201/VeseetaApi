const mongoose = require('mongoose');
const helmet = require('helmet');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const express = require('express');
const app = express();
const morgan = require('morgan');
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

//data from body added to request object
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded());
app.use(helmet());
app.use(express.static(`${__dirname}/public`));
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('tiny'));
}
app.use('/', router);

app.listen(port, () => {
  console.log(`Veseeta app listening on port ${port}`);
});
