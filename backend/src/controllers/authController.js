const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

// ================================
// TOKEN HELPERS
// ================================

// Sign a short-lived access token (1 hour)
const signAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1h'
    });
};

// Generate a crypto-secure random refresh token (raw string)
const generateRefreshToken = () => {
    return crypto.randomBytes(40).toString('hex');
};

// Hash a refresh token with SHA-256 for DB storage
const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

// Cookie options for refresh token
const getRefreshCookieOptions = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,                          // Not accessible via JavaScript
        secure: isProduction,                    // HTTPS only in production
        sameSite: isProduction ? 'strict' : 'lax', // Strict in prod, Lax for local dev
        maxAge: 30 * 24 * 60 * 60 * 1000,       // 30 days in milliseconds
        path: '/'                                // Available globally
    };
};

// Helper: save hashed refresh token to user and set cookie
const attachRefreshToken = async (res, user) => {
    const rawRefreshToken = generateRefreshToken();
    const hashed = hashToken(rawRefreshToken);

    // Store hashed token — single active token per user (overwrites previous)
    await User.findByIdAndUpdate(user._id, { refreshTokenHash: hashed });

    // Set httpOnly cookie
    res.cookie('refreshToken', rawRefreshToken, getRefreshCookieOptions());
};

// ================================
// CONTROLLERS
// ================================

// @desc    Register new user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role, organization } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'applicant',
            organization
        });

        // Generate access token
        const verificationToken = user.createEmailVerificationToken();
        await user.save({ validateBeforeSave: false });

        const clientUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
        const verifyUrl = `${clientUrl}/api/v1/auth/verifyemail/${verificationToken}`;
        const message = `Welcome to YAN Rwanda!\n\nPlease verify your email by clicking the link below:\n${verifyUrl}\n\nIf you did not request this, please ignore this email.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Verify your YAN Rwanda Account',
                message
            });
        } catch (err) {
            console.error('Email verification sending failed:', err);
        }

        const accessToken = signAccessToken(user._id);

        // Attach refresh token (cookie + DB)
        await attachRefreshToken(res, user);

        res.status(201).json({
            success: true,
            token: accessToken,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check if user exists (include password for comparison)
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordCorrect = await user.correctPassword(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Generate access token
        const accessToken = signAccessToken(user._id);

        // Attach refresh token (cookie + DB)
        await attachRefreshToken(res, user);

        res.status(200).json({
            success: true,
            token: accessToken,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Refresh access token using httpOnly cookie
// @route   POST /api/v1/auth/refresh
// @access  Public (cookie-authenticated)
exports.refreshToken = async (req, res, next) => {
    try {
        // 1. Read refresh token from httpOnly cookie
        const rawToken = req.cookies?.refreshToken;

        if (!rawToken) {
            return res.status(401).json({
                success: false,
                message: 'No refresh token provided'
            });
        }

        // 2. Hash the incoming token and look up user
        const incomingHash = hashToken(rawToken);

        const user = await User.findOne({ refreshTokenHash: incomingHash }).select('+refreshTokenHash');

        if (!user) {
            // Possible token reuse attack — token was already rotated
            // Security: Clear the cookie to prevent further reuse attempts
            res.clearCookie('refreshToken', getRefreshCookieOptions());

            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token — session invalidated'
            });
        }

        // 3. Issue new access token
        const accessToken = signAccessToken(user._id);

        // 4. Rotate refresh token (invalidate old, issue new)
        await attachRefreshToken(res, user);

        res.status(200).json({
            success: true,
            token: accessToken
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Logout user — clear refresh token
// @route   POST /api/v1/auth/logout
// @access  Public (best-effort)
exports.logout = async (req, res, next) => {
    try {
        const rawToken = req.cookies?.refreshToken;

        if (rawToken) {
            // Remove hashed token from DB
            const incomingHash = hashToken(rawToken);
            await User.findOneAndUpdate(
                { refreshTokenHash: incomingHash },
                { $unset: { refreshTokenHash: 1 } }
            );
        }

        // Clear the cookie regardless
        res.clearCookie('refreshToken', getRefreshCookieOptions());

        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
    try {
        const fieldsToUpdate = {
            name: req.body.name
        };

        if (req.body.organization !== undefined) {
            fieldsToUpdate.organization = req.body.organization;
        }

        if (req.body.profileImage !== undefined) {
            fieldsToUpdate.profileImage = req.body.profileImage;
        }

        if (req.body.bio !== undefined) {
            fieldsToUpdate.bio = req.body.bio;
        }

        const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'There is no user with that email address.' });
        }

        const resetToken = user.createPasswordResetToken();
        await user.save({ validateBeforeSave: false });

        const clientUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
        const actualResetUrl = `${clientUrl}/reset-password.html?token=${resetToken}`;

        const message = `Forgot your password? Submit a PUT request with your new password to: \n${actualResetUrl}.\nIf you didn't forget your password, please ignore this email!`;
        try {
            await sendEmail({
                email: user.email,
                subject: 'Your password reset token (valid for 10 min)',
                message
            });
            res.status(200).json({ success: true, message: 'Token sent to email!' });
        } catch (err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ success: false, message: 'There was an error sending the email. Try again later!' });
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:token
// @access  Public
exports.resetPassword = async (req, res, next) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Token is invalid or has expired' });
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        const accessToken = signAccessToken(user._id);
        await attachRefreshToken(res, user);

        res.status(200).json({ success: true, token: accessToken });
    } catch (error) {
        next(error);
    }
};

// @desc    Verify email address
// @route   GET /api/v1/auth/verifyemail/:token
// @access  Public
exports.verifyEmail = async (req, res, next) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpire = undefined;
        await user.save({ validateBeforeSave: false });

        const clientUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
        res.redirect(`${clientUrl}/index.html?verified=true`);
    } catch (error) {
        next(error);
    }
};
