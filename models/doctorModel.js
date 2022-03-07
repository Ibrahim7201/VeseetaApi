const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

let doctorSchemaOptions = {
  toJSON: {
    virtuals: true,
  },
};
const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter doctor's name"],
    },
    gender: {
      type: String,
      required: true,
    },
    reservations: [
      {
        hours: {
          type: Number,
          min: 0,
          max: 24,
          required: true,
        },
        minutes: {
          type: Number,
          min: 0,
          max: 60,
          required: true,
        },
        patientName: {
          type: String,
          required: true,
        },
        patientID: {
          type: String,
          required: true,
        },
      },
    ],
    specialization: {
      type: String,
      enum: ["Skin", "Teeth", "Children", "Mental", "Bones", "Ear & Nose", "Brain & Nerves"],
      required: [true, "Please enter doctor's specialization"],
    },
    rates: [{ type: Number, enum: [1, 2, 3, 4, 5], default: 1 }],
    address: {
      type: String,
      required: [true, "Please enter doctor's address"],
    },
    fees: {
      type: String,
      required: [true, "Please enter doctor's fees"],
    },
    phone: {
      type: String,
      required: [true, "Please enter doctor's phone number"],
    },
    duration: {
      type: String,
    },
    availableHours: [
      {
        hours: {
          type: Number,
          min: 0,
          max: 24,
          required: true,
        },
        minutes: {
          type: Number,
          min: 0,
          max: 60,
          required: true,
        },
      },
    ],
  },
  doctorSchemaOptions
);

doctorSchema.virtual("rating").get(function () {
  if (this.rates.length !== 0) {
    let allRates = this.rates.reduce((previousValue, currentValue) => previousValue + currentValue);
    const avg = allRates / this.rates.length;
    return avg;
  } else {
    return 0;
  }
});
doctorSchema.virtual("getGender").get(function () {
  if (this.gender === "Male") {
    return "doctorm.jpg";
  } else if (this.gender === "Female") {
    return "doctorf.jpg";
  } else {
    return "doctor2.jpg";
  }
});
doctorSchema.virtual("timeSingled").get(function () {
  let arr = [];
  this.availableHours.forEach(function (element) {
    arr.push(Math.round((element.hours + element.minutes / 60) * 100) / 100);
  });
  return arr;
});
doctorSchema.virtual("timeFormated").get(function () {
  let arr = [];
  this.availableHours.forEach(function (element) {
    let x = `${element.hours.toString()}:${element.minutes.toString()}`;
    arr.push(x);
  });
  return arr;
});

doctorSchema.virtual("timeLeft").get(function () {
  let d = new Date();
  if (this.timeSingled.length === 0) {
    return "Not availabe today";
  } else {
    for (let i in this.timeSingled) {
      let h = d.getHours();
      let t = d.getMinutes();
      let total = h * 60 + t;
      let x = this.timeSingled[i];
      if (x * 60 > total) {
        let diff = x * 60 - total;
        if (diff < 60) {
          return `${Math.ceil(diff)} Minutes`;
        } else if (diff >= 60) {
          let rem = diff % 60;
          let hours = diff - rem;
          return `${hours / 60} Hours ${Math.ceil(rem)} Minutes`;
        }
      } else if (this.timeSingled.every((element) => element * 60 < total)) {
        return "Not availabe today";
      }
    }
  }
});

doctorSchema.virtual("ratedTimes").get(function () {
  return this.rates.length;
});

const Doctor = mongoose.model("Doctor", doctorSchema);
module.exports = Doctor;
