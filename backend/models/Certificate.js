/**
 * models/Certificate.js
 *
 * IMPORTANT — one model per file.
 * Never paste two mongoose.model() calls into the same file;
 * Node's require() cache means the second registration throws
 * OverwriteModelError if any other file already imported the first model.
 */

'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const CertificateSchema = new Schema(
  {
    // ── Relations ────────────────────────────────────────────────────────────
    student: {
      type:     Schema.Types.ObjectId,
      ref:      'Student',
      required: true,
      // index declared below via schema.index() — NOT here — avoids duplicate warning
    },
    school: {
      type:     Schema.Types.ObjectId,
      ref:      'School',
      required: true,
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref:  'User',
    },
    revokedBy: {
      type: Schema.Types.ObjectId,
      ref:  'User',
    },

    // ── Certificate data ─────────────────────────────────────────────────────
    certType: {
      type:     String,
      required: true,
      enum:     ['Completion', 'Achievement', 'Transfer', 'Merit', 'Participation', 'Graduation'],
    },
    grade:        { type: String, required: true },
    academicYear: { type: String, required: true },
    remarks:      { type: String, default: '' },

    // ── IPFS ──────────────────────────────────────────────────────────────────
    ipfsHash: { type: String },
    ipfsUrl:  { type: String },

    // ── On-chain data ─────────────────────────────────────────────────────────
    tokenId:         { type: String },
    txHash:          { type: String },
    blockNumber:     { type: Number },
    contractAddress: { type: String },

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ['pending', 'active', 'revoked', 'failed'],
      default: 'pending',
    },
    issuedAt: { type: Date, default: Date.now },

    revokedAt:        { type: Date },
    revocationReason: { type: String },
    revocationTxHash: { type: String },

    failureReason: { type: String },
  },
  {
    timestamps: true,
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true },
  }
);

// ── Indexes (ALL declared here — never mix with index:true on the field) ──────
CertificateSchema.index({ student: 1 });
CertificateSchema.index({ school: 1 });
CertificateSchema.index({ certType: 1 });
CertificateSchema.index({ academicYear: 1 });
CertificateSchema.index({ status: 1 });
CertificateSchema.index({ issuedAt: 1 });
CertificateSchema.index({ ipfsHash: 1 }, { sparse: true });
CertificateSchema.index({ tokenId: 1 },  { sparse: true });
CertificateSchema.index({ txHash: 1 },   { sparse: true });

// Compound — covers the duplicate-cert check query in the controller
CertificateSchema.index({ student: 1, certType: 1, academicYear: 1, school: 1 });
// Covers getAllCertificates sorted list
CertificateSchema.index({ school: 1, status: 1, issuedAt: -1 });

// ── Virtual ───────────────────────────────────────────────────────────────────
CertificateSchema.virtual('verificationUrl').get(function () {
  const hash = this.txHash || this.ipfsHash;
  return hash ? `${process.env.PUBLIC_APP_URL}/verify/${hash}` : null;
});

// ── Guard against OverwriteModelError in hot-reload / test environments ───────
module.exports = mongoose.models.Certificate
  || mongoose.model('Certificate', CertificateSchema);