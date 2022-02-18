const express = require("express");
const router = express.Router();
const authController = require("./authController");
const doctorController = require("./doctorController");
const multer = require("multer");
const { replaceOne } = require("./userModel");

/////////////////////
/* Multer Settings */
/////////////////////
const multerStorage = multer.diskStorage({
  /* I am using Temp */
  // destination: (req, file, cb) => {
  //   cb(null, "public/imgs");
  // },
  filename: (req, file, cb) => {
    const ext = file.mimetype.split("/")[1];
    cb(null, `user-${Date.now()}.${ext}`);
  },
});
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new Error("It's not an IMAGE !", 400), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFlter: multerFilter,
});

////////////////
/* App Routes */
////////////////
router.post("/img", upload.single("photo"), authController.uploadImage);
//Signing Up
router.post("/signup", authController.signup);
//Loging in
router.post("/login", authController.login);
//Loging Out
router.post("/logout", authController.logout);
//Getting All Users
router.get("/users", authController.protect, authController.restrictTo("admin"), authController.getAllUsers);
//Deleting Users
router.delete("/users/:id", authController.protect, authController.restrictTo("admin"), authController.delete);
//Adding Doctors
router.post("/doctors", authController.protect, authController.restrictTo("admin"), doctorController.addDoctor);
//Getting Doctors
router.get("/doctors", authController.protect, doctorController.getDoctors);
//Deleting Doctor
router.delete("/doctors/:id", authController.protect, authController.restrictTo("admin"), doctorController.deleteDoctor);
//Editing Doctors
router.patch("/doctors/:id", authController.protect, authController.restrictTo("admin"), doctorController.editDoctor);
//Adding Doctor Rate
router.patch("/doctors/rate/:id", authController.protect, doctorController.rateDoctor);
//Reserving DOCTOR
router.post("/doctors/reservations", authController.protect, doctorController.reservingDoctor);
//Cancelling Reserve DOCTOR
router.post("/doctors/cancelreservations", authController.protect, doctorController.cancelReservationDoctor);
//Adding reservations USER
router.post("/users/reservations", authController.protect, authController.reserve);
//Cancelling reservation USER
router.patch("/users/cancelreservations", authController.protect, authController.reserveCancel);
//Getting Reservations USER
router.get("/users/reservations", authController.protect, authController.getReservations);
//Getting user data
router.get("/user", authController.protect, authController.getUserData);
//Getting user's role
router.get("/role", authController.getMyRole);

router.use(async function (err, req, res, next) {
  res.json(err);
});
module.exports = router;
