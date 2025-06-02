import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { AuthUtils } from '../utils/auth';
import { createError, asyncHandler } from '../middleware/errorHandler';
import validator from 'validator';

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      throw createError('Email, password, and name are required', 400);
    }

    if (!validator.isEmail(email)) {
      throw createError('Invalid email format', 400);
    }

    if (password.length < 6) {
      throw createError('Password must be at least 6 characters long', 400);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw createError('User with this email already exists', 409);
    }

    // Hash password and create user
    const hashedPassword = await AuthUtils.hashPassword(password);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    // Generate token
    const token = AuthUtils.generateToken({ userId: user.id });

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      throw createError('Email and password are required', 400);
    }

    if (!validator.isEmail(email)) {
      throw createError('Invalid email format', 400);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.isActive) {
      throw createError('Invalid credentials', 401);
    }

    // Check password
    const isValidPassword = await AuthUtils.comparePassword(password, user.password);
    if (!isValidPassword) {
      throw createError('Invalid credentials', 401);
    }

    // Generate token
    const token = AuthUtils.generateToken({ userId: user.id });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
      throw createError('Token is required', 400);
    }

    try {
      const decoded = AuthUtils.verifyToken(token);
      
      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        throw createError('User not found or inactive', 401);
      }

      // Generate new token
      const newToken = AuthUtils.generateToken({ userId: user.id });

      res.json({
        user,
        token: newToken
      });
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw createError('Token expired', 401);
      }
      throw createError('Invalid token', 401);
    }
  });

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user.id;

    if (!currentPassword || !newPassword) {
      throw createError('Current password and new password are required', 400);
    }

    if (newPassword.length < 6) {
      throw createError('New password must be at least 6 characters long', 400);
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    // Check current password
    const isValidPassword = await AuthUtils.comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw createError('Current password is incorrect', 400);
    }

    // Hash new password and update
    const hashedNewPassword = await AuthUtils.hashPassword(newPassword);
    
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.json({
      message: 'Password changed successfully'
    });
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email || !validator.isEmail(email)) {
      throw createError('Valid email is required', 400);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Always return success to prevent email enumeration
    res.json({
      message: 'If an account with this email exists, a password reset link has been sent.'
    });

    // TODO: Implement email sending logic here
    if (user) {
      // Generate reset token and send email
      // This would require email service implementation
    }
  });
}

export const authController = new AuthController();
