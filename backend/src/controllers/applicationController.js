const Application = require('../models/Application');
const sendEmail = require('../utils/sendEmail');

// @desc    Submit new application
// @route   POST /api/applications
// @access  Private
exports.submitApplication = async (req, res) => {
    try {
        const { submissionData, documents } = req.body;

        const application = await Application.create({
            applicant: req.user.id,
            submissionData,
            documents
        });

        res.status(201).json({
            success: true,
            data: application
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all applications
// @route   GET /api/applications
// @access  Private/Admin
exports.getApplications = async (req, res) => {
    try {
        const applications = await Application.find()
            .populate('applicant', 'name email organization')
            .sort('-submittedAt');

        res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private
exports.getApplication = async (req, res) => {
    try {
        const application = await Application.findById(req.params.id)
            .populate('applicant', 'name email organization')
            .populate('reviewedBy', 'name email');

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get logged in user's applications
// @route   GET /api/applications/mine
// @access  Private
exports.getMyApplications = async (req, res) => {
    try {
        const applications = await Application.find({ applicant: req.user.id })
            .populate('applicant', 'name email organization')
            .sort('-submittedAt');

        res.status(200).json({
            success: true,
            count: applications.length,
            data: applications
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update application status (Approve/Reject)
// @route   PATCH /api/applications/:id/status
// @access  Private/Admin
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status, reviewerNotes } = req.body;

        if (!req.params.id || req.params.id === 'undefined') {
            return res.status(400).json({
                success: false,
                message: 'Invalid application ID provided (undefined)'
            });
        }

        // Validate ObjectId format
        const mongoose = require('mongoose');
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid application ID format'
            });
        }

        const application = await Application.findByIdAndUpdate(
            req.params.id,
            {
                status,
                reviewerNotes,
                reviewedBy: req.user.id,
                reviewedAt: Date.now()
            },
            { new: true, runValidators: true }
        );

        if (!application) {
            return res.status(404).json({
                success: false,
                message: 'Application not found'
            });
        }

        // UPGRADE USER ROLE ON APPROVAL
        if (status === 'approved') {
            const User = require('../models/User');
            await User.findByIdAndUpdate(application.applicant, {
                role: 'member'
            });
        }

        // SEND NOTIFICATION EMAIL
        try {
            const User = require('../models/User');
            const applicantUser = await User.findById(application.applicant);
            
            if (applicantUser && applicantUser.email) {
                const subject = status === 'approved' ? 'Welcome to Youth Action Network!' : 'Application Update - YAN Rwanda';
                const message = status === 'approved' 
                    ? `Hello ${applicantUser.name},\n\nCongratulations! Your application to join the Youth Action Network has been approved. You now have full access to the member dashboard and learning resources.\n\nBest regards,\nYAN Admin Team`
                    : `Hello ${applicantUser.name},\n\nThank you for your interest in the Youth Action Network. After reviewing your application, we regret to inform you that we cannot accept it at this time.\n\nReason/Notes: ${reviewerNotes || 'N/A'}\n\nKind regards,\nYAN Admin Team`;

                await sendEmail({
                    email: applicantUser.email,
                    subject: subject,
                    message: message
                });
            }
        } catch (emailErr) {
            console.error('Email notification failed:', emailErr);
        }

        res.status(200).json({
            success: true,
            data: application
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
