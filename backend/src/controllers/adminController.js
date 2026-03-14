const User = require('../models/User');
const Organization = require('../models/Organization');
const Opportunity = require('../models/Opportunity');
const Event = require('../models/Event');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Lesson = require('../models/Lesson');
const Certificate = require('../models/Certificate');
const Application = require('../models/Application');

// @desc    Get all users (admin only)
// @route   GET /api/v1/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password -refreshTokenHash');
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user role
// @route   PATCH /api/v1/admin/users/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res, next) => {
    try {
        const { role } = req.body;

        // Prevent changing to an invalid role to be safe
        const validRoles = ['admin', 'member', 'applicant', 'partner', 'public'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role specified'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, runValidators: true }
        ).select('-password -refreshTokenHash');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update organization status
// @route   PATCH /api/v1/admin/organizations/:id/status
// @access  Private/Admin
exports.updateOrganizationStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        const validStatuses = ['active', 'inactive', 'draft'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status specified'
            });
        }

        const organization = await Organization.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        res.status(200).json({
            success: true,
            data: organization
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get system statistics
// @route   GET /api/v1/admin/system-stats
// @access  Private/Admin
exports.getSystemStats = async (req, res, next) => {
    try {
        const userCount = await User.countDocuments();
        const orgCount = await Organization.countDocuments();
        const opportunityCount = await Opportunity.countDocuments();
        const eventCount = await Event.countDocuments();
        const applicationCount = await Application.countDocuments({ status: { $in: ['submitted', 'screening', 'under_review'] } });

        const activeOrgs = await Organization.countDocuments({ status: 'active' });

        // Growth metric: Users in last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newUsers = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

        res.status(200).json({
            success: true,
            data: {
                users: {
                    total: userCount,
                    newLast30Days: newUsers
                },
                organizations: {
                    total: orgCount,
                    active: activeOrgs
                },
                opportunities: {
                    total: opportunityCount
                },
                events: {
                    total: eventCount
                },
                pendingApplications: applicationCount
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get recent applications
// @route   GET /api/v1/admin/recent-applications
// @access  Private/Admin
exports.getRecentApplications = async (req, res, next) => {
    try {
        const applications = await Application.find({ status: { $in: ['submitted', 'screening', 'under_review'] } })
            .sort({ submittedAt: -1 })
            .limit(10)
            .populate('applicant', 'name email');

        res.status(200).json({
            success: true,
            data: applications
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get LMS analytics (admin only)
// @route   GET /api/v1/admin/lms-analytics
// @access  Private/Admin
exports.getLmsAnalytics = async (req, res, next) => {
    try {
        const totalCourses = await Course.countDocuments();
        const totalEnrollments = await Enrollment.countDocuments();
        const totalLessons = await Lesson.countDocuments();
        const totalCertificates = await Certificate.countDocuments();

        // Calculate average progress
        const enrollments = await Enrollment.find();
        const avgProgress = enrollments.length > 0
            ? enrollments.reduce((acc, curr) => acc + curr.progress, 0) / enrollments.length
            : 0;

        // Recently completed enrollments
        const recentCompletions = await Enrollment.find({ progress: 100 })
            .sort({ updatedAt: -1 })
            .limit(5)
            .populate('user', 'name email')
            .populate('course', 'title');

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalCourses,
                    totalEnrollments,
                    totalLessons,
                    totalCertificates,
                    avgProgress: Math.round(avgProgress)
                },
                recentCompletions
            }
        });
    } catch (error) {
        next(error);
    }
};
