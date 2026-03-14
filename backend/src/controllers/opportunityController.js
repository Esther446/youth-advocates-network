const Opportunity = require('../models/Opportunity');

// @desc    Create an opportunity
// @route   POST /api/v1/opportunities
// @access  Private (admin, partner)
exports.createOpportunity = async (req, res, next) => {
    try {
        req.body.createdBy = req.user.id;

        const opportunity = await Opportunity.create(req.body);

        res.status(201).json({
            success: true,
            data: opportunity
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all opportunities
// @route   GET /api/v1/opportunities
// @access  Public (for active), Private/Admin (for all)
exports.getOpportunities = async (req, res, next) => {
    try {
        let authObj = {};

        if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'partner')) {
            authObj = { status: 'active' };
        } else if (req.user && req.user.role === 'partner') {
            authObj = {
                $or: [
                    { status: 'active' },
                    { createdBy: req.user.id }
                ]
            };
        }

        const reqQuery = { ...req.query, ...authObj };

        const opportunities = await Opportunity.find(reqQuery)
            .populate('createdBy', 'name email role')
            .sort({ deadline: 1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: opportunities.length,
            data: opportunities
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single opportunity
// @route   GET /api/v1/opportunities/:id
// @access  Public (for active), Private/Admin (for all)
exports.getOpportunity = async (req, res, next) => {
    try {
        const opportunity = await Opportunity.findById(req.params.id)
            .populate('createdBy', 'name email role');

        if (!opportunity) {
            return res.status(404).json({
                success: false,
                message: 'Opportunity not found'
            });
        }

        if (opportunity.status !== 'active') {
            if (!req.user || (req.user.role !== 'admin' && opportunity.createdBy._id.toString() !== req.user.id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this draft/inactive opportunity'
                });
            }
        }

        res.status(200).json({
            success: true,
            data: opportunity
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update opportunity
// @route   PUT /api/v1/opportunities/:id
// @access  Private (admin, partner own)
exports.updateOpportunity = async (req, res, next) => {
    try {
        let opportunity = await Opportunity.findById(req.params.id);

        if (!opportunity) {
            return res.status(404).json({
                success: false,
                message: 'Opportunity not found'
            });
        }

        if (opportunity.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: `User ${req.user.id} is not authorized to update this opportunity`
            });
        }

        opportunity = await Opportunity.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: opportunity
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete opportunity
// @route   DELETE /api/v1/opportunities/:id
// @access  Private (admin, partner own)
exports.deleteOpportunity = async (req, res, next) => {
    try {
        const opportunity = await Opportunity.findById(req.params.id);

        if (!opportunity) {
            return res.status(404).json({
                success: false,
                message: 'Opportunity not found'
            });
        }

        if (opportunity.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: `User ${req.user.id} is not authorized to delete this opportunity`
            });
        }

        await opportunity.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};
