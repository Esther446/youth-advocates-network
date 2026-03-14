const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const error = new Error('Validation Error');
        error.statusCode = 400;
        // Collect all error messages into an array
        error.errors = errors.array().map(err => err.msg);
        return next(error);
    }
    next();
};

module.exports = validate;
