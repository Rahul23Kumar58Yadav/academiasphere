const mongoose = require("mongoose");

// ── Fee Structure (template per grade/term) ───────────────────────────────
const feeComponentSchema = new mongoose.Schema({
  name:   { type: String, required: true }, // e.g. "Tuition", "Transport"
  amount: { type: Number, required: true, min: 0 },
}, { _id: false });

const feeStructureSchema = new mongoose.Schema({
  schoolId:     { type: mongoose.Schema.Types.ObjectId, ref: "School", required: true },
  grade:        { type: String, required: true },
  term:         { type: String, required: true },   // e.g. "Term 1", "Annual"
  termNumber:   { type: Number },
  academicYear: { type: String, required: true },
  dueDate:      { type: Date,   required: true },
  components:   { type: [feeComponentSchema], required: true },
  totalAmount:  { type: Number, required: true, min: 0 },
  lateFeePct:   { type: Number, default: 0, min: 0, max: 100 },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

feeStructureSchema.index({ schoolId: 1, grade: 1, term: 1, academicYear: 1 }, { unique: true });

const FeeStructure = mongoose.model("FeeStructure", feeStructureSchema);

// ── Payment (one record per student per term) ─────────────────────────────
const paymentEntrySchema = new mongoose.Schema({
  amount:        { type: Number, required: true, min: 0 },
  paymentDate:   { type: Date,   required: true },
  paymentMode:   {
    type: String,
    enum: ["cash", "cheque", "online", "upi", "dd", "card", "other"],
    default: "cash",
  },
  transactionId: { type: String },
  receiptNo:     { type: String },
  collectedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  note:          { type: String },
}, { timestamps: true });

const paymentSchema = new mongoose.Schema({
  schoolId:   { type: mongoose.Schema.Types.ObjectId, ref: "School",   required: true },
  studentId:  { type: mongoose.Schema.Types.ObjectId, ref: "Student",  required: true },
  structureId:{ type: mongoose.Schema.Types.ObjectId, ref: "FeeStructure" },

  // Denormalised for fast querying
  grade:        { type: String },
  section:      { type: String },
  term:         { type: String },
  termNumber:   { type: Number },
  academicYear: { type: String },

  // Amounts
  amount:       { type: Number, required: true, min: 0 }, // original due
  discount:     { type: Number, default: 0, min: 0 },
  lateFee:      { type: Number, default: 0, min: 0 },
  totalDue:     { type: Number, default: 0 },   // amount - discount + lateFee
  totalPaid:    { type: Number, default: 0 },
  balance:      { type: Number, default: 0 },   // totalDue - totalPaid

  status: {
    type: String,
    enum: ["pending", "partial", "paid", "overdue", "waived"],
    default: "pending",
  },

  dueDate:  { type: Date },
  paidAt:   { type: Date },   // date of last/full payment

  payments: { type: [paymentEntrySchema], default: [] },

  invoiceNo:   { type: String },
  waiveReason: { type: String },
  waiveBy:     { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  remarks: { type: String },
}, { timestamps: true });

// Auto-compute balance before save
paymentSchema.pre("save", function (next) {
  this.totalDue  = (this.amount - this.discount + this.lateFee);
  this.totalPaid = this.payments.reduce((sum, p) => sum + p.amount, 0);
  this.balance   = this.totalDue - this.totalPaid;

  if (this.balance <= 0)           this.status = "paid";
  else if (this.totalPaid > 0)     this.status = "partial";
  else if (this.dueDate && new Date() > this.dueDate) this.status = "overdue";
  else                             this.status = "pending";

  if (this.status === "paid" && !this.paidAt) this.paidAt = new Date();
  next();
});

paymentSchema.index({ schoolId: 1, studentId: 1, term: 1, academicYear: 1 });
paymentSchema.index({ schoolId: 1, status: 1 });
paymentSchema.index({ schoolId: 1, paidAt: 1 });
paymentSchema.index({ dueDate: 1, status: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
module.exports.FeeStructure = FeeStructure;