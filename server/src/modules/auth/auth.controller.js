const authService = require('./auth.service');

/**
 * Login merchant
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login(email, password);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout merchant
 * POST /api/auth/logout
 */
exports.logout = async (req, res, next) => {
  try {
    // With JWT, logout is handled client-side by removing the token
    // For enhanced security, could implement token blacklist here
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user profile
 * GET /api/auth/me
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = req.user; // Set by auth middleware

    res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        merchant_id: user.merchant_id,
        status: user.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forgot password - Send reset token
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const result = await authService.forgotPassword(email);

    res.json({
      success: true,
      message: 'Password reset token has been sent to your email',
      data: {
        email: result.email,
        // In development, return token for testing (remove in production)
        ...(process.env.NODE_ENV === 'development' && { token: result.resetToken })
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 * POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    await authService.resetPassword(token, password);

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    next(error);
  }
};
