/**
 * models/BlockchainTransaction.js
 *
 * Off-chain mirror of every on-chain transaction initiated by the platform.
 * Keep this in its own file — never combine two mongoose.model() calls.
 */

'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const BlockchainTransactionSchema = new Schema(
  {
    school: {
      type: Schema.Types.ObjectId,
      ref:  'School',
    },
    type: {
      type: String,
      enum: ['CERTIFICATE_MINT', 'CERTIFICATE_REVOKE', 'FEE_PAYMENT', 'AUDIT_LOG'],
    },

    // The MongoDB document this transaction relates to
    entityId:    { type: Schema.Types.ObjectId },
    entityModel: { type: String },          // 'Certificate' | 'Fee' etc.

    // On-chain fields
    txHash:      { type: String },
    blockNumber: { type: Number },
    gasUsed:     { type: String },

    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref:  'User',
    },

    // Arbitrary extra metadata (revocation reason, fee amount, etc.)
    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// ── Indexes (only here — never also set index:true on the field above) ────────
BlockchainTransactionSchema.index({ school: 1, createdAt: -1 });
BlockchainTransactionSchema.index({ type: 1,   createdAt: -1 });
BlockchainTransactionSchema.index({ txHash: 1 }, { sparse: true });

// ── Guard against OverwriteModelError ────────────────────────────────────────
module.exports = mongoose.models.BlockchainTransaction
  || mongoose.model('BlockchainTransaction', BlockchainTransactionSchema);