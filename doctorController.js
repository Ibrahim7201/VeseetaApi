const Doctor = require("./doctorModel");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });
const { promisify } = require("util");

exports.addDoctor = async (req, res, next) => {
  try {
    const { name, specialization, rates, gender, address, fees, phone, duration, img, availableHours } = req.body;
    const newDoctor = await Doctor.create({ name, gender, specialization, rates, address, fees, phone, duration, img, availableHours });
    res.status(201).json({
      status: "Doctor Added Successffully",
      data: {
        Doctor: newDoctor,
      },
    });
  } catch (err) {
    err.statusCode = 404;
    err.code = "Error in Adding doctor";
    next(err);
  }
};

exports.getDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find();
    res.json(doctors);
  } catch (err) {
    err.statusCode = 404;
    err.code = "Error in Getting Doctors";
    next(err);
  }
};

exports.deleteDoctor = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const doctor = await Doctor.find({ _id });
    await Doctor.findByIdAndDelete({ _id });
    res.json(`Deleted Dr. ${doctor[0].name} Successfully`);
  } catch (err) {
    err.statusCode = 404;
    err.code = "Error in Deleting doctor";
    next(err);
  }
};
exports.editDoctor = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const { name, specialization, rates, gender, address, fees, phone, duration, img, availableHours } = req.body;
    await Doctor.findOneAndUpdate({ _id }, { name, specialization, rates, gender, address, fees, phone, duration, img, availableHours }, { new: true, runValidators: true });
    res.json("Done Editing");
  } catch (err) {
    err.statusCode = 404;
    err.code = "Error in editing doctor";
    next(err);
  }
};
exports.rateDoctor = async (req, res, next) => {
  try {
    const _id = req.params.id;
    const { rate } = req.body;
    const [doctor] = await Doctor.find({ _id });
    let doctorRate = doctor.rates;
    doctorRate.push(rate);
    await Doctor.findByIdAndUpdate({ _id }, { rates: doctorRate });
    res.json("Rate Added Successfully");
  } catch (err) {
    err.statusCode = 404;
    err.code = "Error in Rating doctor";
    next(err);
  }
};

exports.reservingDoctor = async (req, res, next) => {
  try {
    let { _id, hours, minutes, patientName } = req.body;
    let token = req.cookies.jwt;
    const payLoad = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const [doctor] = await Doctor.find({ _id });
    let doctorReservations = doctor.availableHours;
    doctorReservations.forEach((el, i) => {
      if (el.hours == hours && el.minutes == minutes) {
        doctorReservations.splice(i, 1);
      }
    });
    let doctorTotalReservations = doctor.reservations;
    doctorTotalReservations.push({ hours, minutes, patientID: payLoad.id, patientName });
    await Doctor.findByIdAndUpdate({ _id }, { availableHours: doctorReservations, reservations: doctorTotalReservations });
    res.json("Done Reserving for Doctor");
  } catch (err) {
    err.statusCode = 422;
    err.code = "Error in reservation for Doctor";
    next(err);
  }
};
exports.cancelReservationDoctor = async (req, res, next) => {
  try {
    let { doctor_id, hours, minutes } = req.body;
    let obj = { hours, minutes };
    const [doctor] = await Doctor.find({ _id: doctor_id });
    let availableHours = doctor.availableHours;
    availableHours.push(obj);
    let reservations = doctor.reservations;
    reservations.forEach((reservation, i) => {
      if (reservation.hours == hours && reservation.minutes == minutes) {
        reservations.splice(i, 1);
      }
    });
    await Doctor.findByIdAndUpdate({ _id: doctor_id }, { availableHours, reservations });
    res.json("Done Cancelling for doctor");
  } catch (err) {
    err.statusCode = 422;
    err.code = "Error in reservation for Doctor";
    next(err);
  }
};
