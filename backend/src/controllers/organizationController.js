const Organization = require('../models/Organization');

// @desc    Create an organization
// @route   POST /api/v1/organizations
// @access  Private (admin, partner)
exports.createOrganization = async (req, res, next) => {
    try {
        // Force the createdBy field to be the logged in user
        req.body.createdBy = req.user.id;

        const organization = await Organization.create(req.body);

        res.status(201).json({
            success: true,
            data: organization
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all organizations
// @route   GET /api/v1/organizations
// @access  Public (for active), Private/Admin (for all)
exports.getOrganizations = async (req, res, next) => {
    try {
        let query;
        let authObj = {};

        // If user is not admin and not partner, they can only see active organizations
        if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'partner')) {
            authObj = { status: 'active' };
        } else if (req.user && req.user.role === 'partner') {
            // Partners can see all active, plus their own drafts/inactive
            authObj = {
                $or: [
                    { status: 'active' },
                    { createdBy: req.user.id }
                ]
            };
        }
        // Admins can see everything (authObj stays empty)

        // Allow frontend query filtering too
        const reqQuery = { ...req.query, ...authObj };

        // Exclude select fields like sort, page, etc. if implementing advanced queries later
        query = Organization.find(reqQuery).populate('createdBy', 'name email role');

        const organizations = await query;

        res.status(200).json({
            success: true,
            count: organizations.length,
            data: organizations
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single organization
// @route   GET /api/v1/organizations/:id
// @access  Public (for active), Private/Admin (for all)
exports.getOrganization = async (req, res, next) => {
    try {
        const organization = await Organization.findById(req.params.id)
            .populate('createdBy', 'name email role');

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        // Visibility check
        if (organization.status !== 'active') {
            if (!req.user || (req.user.role !== 'admin' && organization.createdBy._id.toString() !== req.user.id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this draft/inactive organization'
                });
            }
        }

        res.status(200).json({
            success: true,
            data: organization
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update organization
// @route   PUT /api/v1/organizations/:id
// @access  Private (admin, partner own)
exports.updateOrganization = async (req, res, next) => {
    try {
        let organization = await Organization.findById(req.params.id);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        // Make sure user is organization owner or admin
        if (organization.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: `User ${req.user.id} is not authorized to update this organization`
            });
        }

        organization = await Organization.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: organization
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete organization
// @route   DELETE /api/v1/organizations/:id
// @access  Private (admin, partner own)
exports.deleteOrganization = async (req, res, next) => {
    try {
        const organization = await Organization.findById(req.params.id);

        if (!organization) {
            return res.status(404).json({
                success: false,
                message: 'Organization not found'
            });
        }

        // Make sure user is organization owner or admin
        if (organization.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: `User ${req.user.id} is not authorized to delete this organization`
            });
        }

        await organization.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};
