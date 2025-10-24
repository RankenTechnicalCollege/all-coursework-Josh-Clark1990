import express from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validator.js';
import { registerSchema, loginSchema } from '../../validation/userSchema.js';

export const authRouter = express.Router();

// Signup route
authRouter.post('/sign-up/email', validate(registerSchema), async (req, res) => {
  const { email, password, confirmPassword, fullName, givenName, familyName, role } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  try {
    const result = await auth.api.signUpEmail({
      email,
      password,
      profile: { givenName, familyName, fullName },
      role: { name: role }
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: result.user,
      session: result.session
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(err.statusCode || 500).json({
      error: err.body?.message || 'Failed to register user'
    });
  }
});


// Login route
authRouter.post('/login', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  try {
    const session = await auth.emailAndPassword.login({ email, password });

    res.cookie('auth_token', result.session.token, {
      httpOnly: true,
      secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000
    });

    res.status(200).json({
      message: `Login successful. Welcome back!`,
      user: session.user
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(err.statusCode || 401).json({
      error: err.body?.message || 'Invalid email or password'
    });
  }
});
