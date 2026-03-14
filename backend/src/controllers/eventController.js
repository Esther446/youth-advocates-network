const Event = require('../models/Event');

// @desc    Create an event
// @route   POST /api/v1/events
// @access  Private (admin, partner)
exports.createEvent = async (req, res, next) => {
    try {
        req.body.createdBy = req.user.id;

        const event = await Event.create(req.body);

        res.status(201).json({
            success: true,
            data: event
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all events
// @route   GET /api/v1/events
// @access  Public (for active), Private/Admin (for all)
exports.getEvents = async (req, res, next) => {
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

        const events = await Event.find(reqQuery)
            .populate('createdBy', 'name email role')
            .sort({ date: 1 });

        res.status(200).json({
            success: true,
            count: events.length,
            data: events
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single event
// @route   GET /api/v1/events/:id
// @access  Public (for active), Private/Admin (for all)
exports.getEvent = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('createdBy', 'name email role');

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        if (event.status !== 'active') {
            if (!req.user || (req.user.role !== 'admin' && event.createdBy._id.toString() !== req.user.id)) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this draft/inactive event'
                });
            }
        }

        res.status(200).json({
            success: true,
            data: event
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update event
// @route   PUT /api/v1/events/:id
// @access  Private (admin, partner own)
exports.updateEvent = async (req, res, next) => {
    try {
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: `User ${req.user.id} is not authorized to update this event`
            });
        }

        event = await Event.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: event
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete event
// @route   DELETE /api/v1/events/:id
// @access  Private (admin, partner own)
exports.deleteEvent = async (req, res, next) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: `User ${req.user.id} is not authorized to delete this event`
            });
        }

        await event.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};
