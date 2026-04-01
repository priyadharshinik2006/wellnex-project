import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendRealEmail } from '../services/email.service.js';
import prisma from '../utils/prisma.js'; // Use .js extension for ESM if configuring for Node 18+ module type, otherwise prisma

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, department, rollNumber, year, phone, gender } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'User already exists' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'STUDENT',
        department,
        rollNumber,
        year,
        phone,
        gender
      },
    });

    res.status(201).json({ message: 'User registered successfully', userId: user.id });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error registering user' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    // Find user
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check password
    console.log(`[Auth Debug] Attempting login for: ${normalizedEmail}`);
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`[Auth Debug] Password mismatch for: ${normalizedEmail}`);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    console.log(`[Auth Debug] Login successful for: ${normalizedEmail}`);

    // Generate JWT
    const payload = {
      id: user.id,
      role: user.role,
      email: user.email,
      rollNumber: user.rollNumber,
      department: user.department
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'supersecretkey12345', { expiresIn: '1d' });

    res.json({ message: 'Login successful', token, user: { 
        id: user.id, 
        name: user.name, 
        role: user.role,
        email: user.email,
        department: user.department,
        rollNumber: user.rollNumber,
        phone: user.phone
    } });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error logging in' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return 404 to let frontend know the email is not registered
      res.status(404).json({ error: 'Email not found in our records' });
      return;
    }

    // Generate a reset token (valid for 15 minutes)
    const resetToken = jwt.sign(
       { id: user.id, email: user.email },
       process.env.JWT_SECRET || 'supersecretkey12345',
       { expiresIn: '15m' }
    );
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;


    // Send email
    const subject = 'Reset Your WellNex Password';
    const text = `Hello ${user.name},\n\nYou requested a password reset for your WellNex account. Please return to the application to set your new password.\n\nBest regards,\nThe WellNex Team`;
    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #4f46e5; margin: 0;">WellNex</h1>
          <p style="color: #64748b; font-size: 16px;">Student Wellness & Support</p>
        </div>
        <div style="padding: 20px; color: #1e293b;">
          <h2 style="font-size: 20px; font-weight: 700; margin-bottom: 20px;">Password Reset Request</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>We received a request to reset your password for your WellNex account. Click the button below to set a new password. This link is valid for 15 minutes.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block;">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #94a3b8;">If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
        </div>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center;">
          <p>&copy; ${new Date().getFullYear()} WellNex System. All rights reserved.</p>
        </div>
      </div>
    `;

    const emailSent = await sendRealEmail(email, subject, text, html);
    
    if (emailSent) {
      res.json({ message: 'Reset link sent successfully' });
    } else {
      res.status(500).json({ error: 'Failed to send reset email. Please try again later.' });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error processing forgot password request' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;
    
    if (!token) {
        res.status(400).json({ error: 'Invalid or missing reset token.' });
        return;
    }

    // Decode token
    let decoded: any;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey12345');
    } catch (err) {
        res.status(401).json({ error: 'Token is invalid or has expired.' });
        return;
    }

    // Find User
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
        res.status(404).json({ error: 'User associated with this token not found.' });
        return;
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password reset successful' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error resetting password' });
  }
};
