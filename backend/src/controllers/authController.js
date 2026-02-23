const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
        path: '/api/v1/auth'                     // Only sent to auth routes
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
exports.register = async (req, res) => {
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
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res) => {
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
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get current user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Refresh access token using httpOnly cookie
// @route   POST /api/v1/auth/refresh
// @access  Public (cookie-authenticated)
exports.refreshToken = async (req, res) => {
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
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Logout user — clear refresh token
// @route   POST /api/v1/auth/logout
// @access  Public (best-effort)
exports.logout = async (req, res) => {
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
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
