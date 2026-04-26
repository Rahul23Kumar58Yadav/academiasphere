const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subject name is required"],
      trim: true,
    },
    code: {
      type: String,
      required: [true, "Subject code is required"],
      trim: true,
      uppercase: true,
    },
    description: { type: String, trim: true, default: "" },
    type: {
      type: String,
      enum: ["Core", "Elective", "Language", "Co-Curricular", "Vocational"],
      default: "Core",
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },
    assignedClasses: [
      {
        classId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Class",
          // required: false   // keep optional for now
        },
        className: {
          type: String,
          trim: true,
          required: [true, "Class name is required when assigning classes"],
        },
      },
    ],
    maxMarks: { type: Number, default: 100 },
    passMarks: { type: Number, default: 33 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Same subject code cannot exist twice in the same school
subjectSchema.index({ schoolId: 1, code: 1 }, { unique: true });

const Subject = mongoose.model("Subject", subjectSchema);

// =============================================================================
// Exports — import whichever model you need:
//   const { School, Subject } = require("../models/School");
//   const School = require("../models/School").School;   // named
// =============================================================================
module.exports =   Subject ;
