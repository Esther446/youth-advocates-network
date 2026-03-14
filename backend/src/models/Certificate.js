const mongoose = require('mongoose');
const crypto = require('crypto');

const CertificateSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.ObjectId,
        ref: 'Course',
        required: true
    },
    certificateId: {
        type: String,
        unique: true,
        index: true
    },
    completionDate: {
        type: Date,
        required: true
    },
    issuedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'revoked'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Prevent duplicate certificates for the same enrollment
CertificateSchema.index({ user: 1, course: 1 }, { unique: true });

// Pre-save hook to generate unique certificate ID
CertificateSchema.pre('save', function () {
    if (!this.certificateId) {
        const year = new Date().getFullYear();
        // Generate an 8-character uppercase alphanumeric string
        const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase();
        this.certificateId = `CERT-${year}-${randomStr}`;
    }
});

module.exports = mongoose.model('Certificate', CertificateSchema);
