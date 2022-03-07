const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const doctorController = require("../controllers/doctorController");
const upload = require("../utils/multer");

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
