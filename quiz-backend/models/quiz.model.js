const mongoose = require("mongoose");

// 🔥 QUESTION SUB-SCHEMA
const questionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["mcq", "truefalse", "multiselect", "short"],
    default: "mcq",
  },

  question: {
    type: String,
    default: "",
    trim: true,
    minlength: 5,
  },

  options: {
    type: [String],
    required: true,

    validate: [
      {
        validator: function (arr) {
          if (this.type === "short") return true;
          return arr.length >= 2;
        },
        message: "At least 2 options required",
      },
      {
        validator: function (arr) {
          if (this.type === "short") return true;
          return arr.every((opt) => opt.trim().length > 0);
        },
        message: "Options cannot be empty",
      },
      {
        validator: function (arr) {
          if (this.type === "short") return true;
          return new Set(arr).size === arr.length;
        },
        message: "Duplicate options not allowed",
      },
    ],
  },

  answer: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    validate: {
      validator: function (val) {
        if (this.type === "short") {
          return typeof val === "string" && val.trim().length > 0;
        }

        if (this.type === "multiselect") {
          return (
            Array.isArray(val) &&
            val.length > 0 &&
            val.every(
              (item) =>
                Number.isInteger(item) &&
                this.options &&
                item >= 0 &&
                item < this.options.length
            )
          );
        }

        return (
          Number.isInteger(val) &&
          this.options &&
          val >= 0 &&
          val < this.options.length
        );
      },
      message: "Invalid answer index",
    },
  },
});

// 🔥 MAIN QUIZ SCHEMA
const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
    },

    subject: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },

    // ✅ SET (Set 1 / Set 2 / Custom)
    set: {
      type: String,
      trim: true,
      default: "Set 1",
      maxlength: 40,
    },

    // 🔥 TEACHER LINK
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    examDate: {
      type: Date,
      default: Date.now,
    },

    examDay: {
      type: String,
      enum: [
        "Sunday", "Monday", "Tuesday", "Wednesday",
        "Thursday", "Friday", "Saturday",
      ],
      default: "Sunday",
    },

    startAt: {
      type: Date,
      default: null,
    },

    endAt: {
      type: Date,
      default: null,
    },

    duration: {
      type: Number,
      default: 60,
      min: 15,
      max: 7200,
    },

    questions: {
      type: [questionSchema],
      validate: {
        validator: function (arr) { return arr.length > 0; },
        message: "Quiz must have at least 1 question",
      },
    },
  },
  { timestamps: true }
);

// 🔥 INDEXES
quizSchema.index({ subject: 1 });
quizSchema.index({ set: 1 });
quizSchema.index({ createdBy: 1 });
quizSchema.index({ examDate: 1 });
quizSchema.index({ examDay: 1 });
quizSchema.index({ startAt: 1 });
quizSchema.index({ endAt: 1 });

module.exports = mongoose.model("Quiz", quizSchema);
