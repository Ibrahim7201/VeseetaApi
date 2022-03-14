const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const doctorController = require('../controllers/doctorController');
const userController = require('../controllers/userController');
const upload = require('../utils/multer');
const globalError = require('../controllers/errorController');
const AppError = require('../utils/appError');

//Auth
router
   .route('/auth')
   .put(authController.login)
   .post(authController.signup)
   .delete(authController.logout)
   .get(authController.forgetPassword)
   .patch(authController.protect, authController.updatePassword);

router.patch('/reset-password/:token', authController.resetPassword);
router.patch('/update-me', authController.protect, userController.updateMe);
//Doctors
router
   .route('/doctors/:id?')
   .post(
      authController.protect,
      authController.restrictTo('admin'),
      doctorController.addDoctor
   )
   .get(authController.protect, doctorController.getDoctors)
   .delete(
      authController.protect,
      authController.restrictTo('admin'),
      doctorController.deleteDoctor
   )
   .patch(
      authController.protect,
      authController.restrictTo('admin'),
      doctorController.editDoctor
   );

router
   .route('/doctor-reservations')
   .post(authController.protect, doctorController.reservingDoctor)
   .delete(authController.protect, doctorController.cancelReservationDoctor);
router.patch(
   '/doctors/rate/:id',
   authController.protect,
   doctorController.rateDoctor
);
//Users
router
   .route('/user-reservations')
   .post(authController.protect, userController.reserve)
   .delete(authController.protect, userController.reserveCancel)
   .get(authController.protect, userController.getReservations);
router
   .route('/user-controller')
   .get(authController.protect, userController.getUserData)
   .post(upload.single('photo'), userController.uploadImage)
   .put(
      authController.protect,
      authController.restrictTo('admin'),
      userController.getAllUsers
   );
router.delete(
   '/users/:id',
   authController.protect,
   authController.restrictTo('admin'),
   userController.delete
);

// router.all('*', (req, res, next) => {
//    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
// });

router.use(globalError);
module.exports = router;
