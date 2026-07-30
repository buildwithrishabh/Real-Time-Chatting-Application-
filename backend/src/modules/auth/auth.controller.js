const authService = require('./auth.service');
const { StatusCodes } = require('../../common/appError');

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.validated?.body || req.body);
    res.status(StatusCodes.CREATED).json({
      status: 'success',
      message: 'User registered successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, deviceId, deviceName } = req.validated?.body || req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];

    const tokens = await authService.login({
      email,
      password,
      deviceId,
      deviceName,
      ipAddress,
      userAgent
    });

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Login successful',
      data: tokens
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    const tokens = await authService.rotateToken(refreshToken);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Token rotated successfully',
      data: tokens
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const deviceId = req.user.deviceId;

    await authService.logout(userId, deviceId);

    res.clearCookie('refreshToken');

    res.status(StatusCodes.OK).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};


const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.validated?.params || req.params;
    const result = await authService.verifyEmail(token);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.validated?.body || req.body;
    const result = await authService.resendVerificationEmail(email);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.validated?.body || req.body;
    const result = await authService.forgotPassword(email);
    res.status(StatusCodes.OK).json(result); 
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.validated?.params || req.params;
    const { newPassword } = req.validated?.body || req.body;
    const result = await authService.resetPassword({ token, newPassword });
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
};
