const mongoose = require("mongoose");
const helmet = require("helmet");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const express = require("express");
const app = express();
const morgan = require("morgan");
const port = process.env.PORT || 3000;
const cors = require("cors");
const router = require("./veseetaRouter");
const cookieParser = require("cookie-parser");

//////////////
/* Online DB */
const onlineDB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);
//////////////
//////////////
/* Local DB */
const localDB = process.env.DATABASE_LOCAL;
//////////////

//Connection
main();
async function main() {
  try {
    await mongoose.connect(onlineDB);
  } catch (err) {
    console.log(err.message);
  }
}
//Middlewares
// app.use(cors());
// app.options("*", cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded());
app.use(helmet());
app.use(express.static(`${__dirname}/public`));
if (process.env.NODE_ENV === "development") {
  app.use(morgan("tiny"));
}
// app.use((req, res, next) => {
//   console.log(req.cookies);
//   next();
// });

app.use(function (req, res, next) {
  // Website you wish to allow to connect
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:4200");
  // Request methods you wish to allow
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, PATCH, DELETE");
  // Request headers you wish to allow
  res.setHeader("Access-Control-Allow-Headers", "X-Requested-With,content-type");
  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader("Access-Control-Allow-Credentials", true);
  // Pass to next layer of middleware
  next();
});

app.use("/veseeta", router);
//Listening
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
