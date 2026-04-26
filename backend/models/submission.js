// models/submission.model.js
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const SubmissionSchema = new Schema(
  {
    assignmentId: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    studentId:    { type: Schema.Types.ObjectId, ref: 'User',       required: true },
    schoolId:     { type: Schema.Types.ObjectId, ref: 'School',     required: true, index: true },
    teacherId:    { type: Schema.Types.ObjectId, ref: 'User',       required: true, index: true },

    // FIX 1: Added 'draft' and 'pending' to enum.
    // Previous enum ['submitted','graded','returned','resubmit'] caused saveDraft()
    // and submitAssignment() to throw a Mongoose ValidationError on every call,
    // which the asyncHandler caught and returned as a 500 — showing the
    // "Could not load assignments" banner even though the GET worked.
    submissionType: { type: String, enum: ['file','text','link','both'], default: 'file' },

    files: [{ name: String, size: String, url: String, type: String }],
    textContent: { type: String, default: '' },
    linkUrl:     { type: String, default: '' },

    // FIX 2: 'comments' was used in saveDraft() and submitAssignment() controllers
    // but was never declared in the schema, so it was silently stripped by Mongoose.
    comments: { type: String, default: '' },

    // FIX 3: studentName / rollNumber set by submitAssignment() but not in schema.
    // Mongoose strict mode silently dropped them; population then returned nulls.
    studentName: { type: String, default: '' },
    rollNumber:  { type: String, default: '' },

    submittedAt: { type: Date,    default: null },
    isLate:      { type: Boolean, default: false },

    // FIX 4: Enum now includes every status the controllers actually write.
    //   draft     → saveDraft()
    //   pending   → submitAssignment() (awaiting teacher review)
    //   submitted → kept for compatibility
    //   graded    → gradeSubmission()
    //   returned  → returnSubmission()
    //   resubmit  → teacher can request a redo
    status: {
      type: String,
      enum: ['draft', 'pending', 'submitted', 'graded', 'returned', 'resubmit'],
      default: 'draft',
      index: true,
    },

    marks:    { type: Number, default: null },
    score:    { type: Number, default: null },
    feedback: { type: String, default: '' },
    gradedAt: { type: Date,   default: null },
    gradedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },

    aiScore:         { type: Number, default: null },
    plagiarismScore: { type: Number, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

// One submission per student per assignment
SubmissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

module.exports = model('Submission', SubmissionSchema);