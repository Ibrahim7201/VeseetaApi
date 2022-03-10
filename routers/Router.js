const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const doctorController = require("../controllers/doctorController");
const userController = require("../controllers/userController");
const upload = require("../utils/multer");

//Auth
router.route("/auth").get(authController.login).post(authController.signup).delete(authController.logout);
//Doctors
router.route("/doctors").get(authController.protect, doctorController.getDoctors).post(authController.protect, authController.restrictTo("admin"), doctorController.addDoctor);
router.route("/doctors/:id").delete(authController.protect, authController.restrictTo("admin"), doctorController.deleteDoctor).patch(authController.protect, authController.restrictTo("admin"), doctorController.editDoctor);
router.patch("/doctors/rate/:id", authController.protect, doctorController.rateDoctor);
router.route("/doctor-reservations").post(authController.protect, doctorController.reservingDoctor).delete(authController.protect, doctorController.cancelReservationDoctor);
//Users
router.route("/user-reservations").post(authController.protect, userController.reserve).delete(authController.protect, userController.reserveCancel).get(authController.protect, userController.getReservations);
router.route("/user-controller").get(authController.protect, userController.getUserData).post(upload.single("photo"), userController.uploadImage).delete(userController.getMyRole).put(authController.protect, authController.restrictTo("admin"), userController.getAllUsers);
router.delete("/users/:id", authController.protect, authController.restrictTo("admin"), userController.delete);

//Adding Doctors
// router.post("/doctors", authController.protect, authController.restrictTo("admin"), doctorController.addDoctor);
//Getting Doctors
// router.get("/doctors", authController.protect, doctorController.getDoctors);
//Deleting Doctor
// router.delete("/doctors/:id", authController.protect, authController.restrictTo("admin"), doctorController.deleteDoctor);
//Editing Doctors
// router.patch("/doctors/:id", authController.protect, authController.restrictTo("admin"), doctorController.editDoctor);
//Adding Doctor Rate
//Reserving DOCTOR
// router.post("/doctor-reservations", authController.protect, doctorController.reservingDoctor);
//Cancelling Reserve DOCTOR
// router.delete("/doctor-reservations", authController.protect, doctorController.cancelReservationDoctor);
//Adding reservations USER
// router.post("/user-reservations", authController.protect, userController.reserve);
//Cancelling reservation USER
// router.delete("/user-reservations", authController.protect, userController.reserveCancel);
//Getting Reservations USER
// router.get("/user-reservations", authController.protect, userController.getReservations);
//Getting user data

// router.get("/user", authController.protect, userController.getUserData);
//Getting user's role
// router.get("/role", userController.getMyRole);
//Getting All Users
// router.get("/users", authController.protect, authController.restrictTo("admin"), userController.getAllUsers);
//Deleting Users
// router.post("/img", upload.single("photo"), userController.uploadImage);

router.use(async function (err, req, res, next) {
  res.json(err);
});
module.exports = router;
