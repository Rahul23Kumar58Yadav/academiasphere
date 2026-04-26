// models/assignment.model.js
const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const RubricItemSchema = new Schema(
  { criteria: { type: String, required: true }, points: { type: Number, required: true, min: 0 }, description: { type: String, default: '' } },
  { _id: false },
);
const AttachmentSchema = new Schema(
  { name: { type: String, required: true }, size: { type: String }, url: { type: String, required: true }, type: { type: String } },
  { _id: false },
);
const ResourceSchema = new Schema(
  { title: { type: String, required: true }, url: { type: String, required: true } },
  { _id: false },
);

const AssignmentSchema = new Schema(
  {
    teacherId:   { type: Schema.Types.ObjectId, ref: 'User',   required: true, index: true },
    teacherName: { type: String, required: true },
    schoolId:    { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    title:        { type: String, required: true, trim: true },
    subject:      { type: String, required: true },
    grade:        { type: String, required: true },
    sections:     { type: [String], required: true },
    description:  { type: String, default: '' },
    instructions: { type: String, default: '' },
    dueDate:      { type: Date,   required: true },
    maxMarks:     { type: Number, required: true, min: 1, default: 100 },
    passingMarks: { type: Number, default: 40, min: 0 },
    assignmentType:      { type: String, enum: ['homework','project','quiz','lab','presentation','essay','other'], default: 'homework' },
    submissionType:      { type: String, enum: ['file','text','link','both'], default: 'file' },
    allowLateSubmission: { type: Boolean, default: false },
    latePenalty:         { type: Number,  default: 10, min: 0, max: 100 },
    priority:            { type: String, enum: ['low','normal','high','urgent'], default: 'normal' },
    difficulty:          { type: String, enum: ['easy','medium','hard'], default: 'medium' },
    estimatedTime:       { type: Number, default: 60 },
    status: { type: String, enum: ['draft','published','closed'], default: 'draft', index: true },
    notifyStudents: { type: Boolean, default: true },
    notifyParents:  { type: Boolean, default: false },
    tags:               { type: [String], default: [] },
    learningObjectives: { type: [String], default: [] },
    rubric:             { type: [RubricItemSchema], default: [] },
    attachments:        { type: [AttachmentSchema], default: [] },
    resources:          { type: [ResourceSchema],   default: [] },
    totalStudents:      { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

AssignmentSchema.virtual('submissions', {
  ref: 'Submission', localField: '_id', foreignField: 'assignmentId', count: true,
});
AssignmentSchema.virtual('graded', {
  ref: 'Submission', localField: '_id', foreignField: 'assignmentId', count: true, match: { status: 'graded' },
});

AssignmentSchema.index({ teacherId: 1, status: 1 });
AssignmentSchema.index({ schoolId: 1, grade: 1, sections: 1 });
AssignmentSchema.index({ dueDate: 1 });

module.exports = model('Assignment', AssignmentSchema);