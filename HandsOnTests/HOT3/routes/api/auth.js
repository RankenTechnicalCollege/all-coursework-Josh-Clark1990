import express from 'express';
import { auth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validator.js';
import { registerSchema, loginSchema } from '../../validation/userSchema.js';
import { getDb } from '../../database.js';

const authRouter = express.Router();

//Register new user---------------------------------------------------------------------------------------------------------------
authRouter.post('/sign-up/email', validate(registerSchema), async (req, res) => {
  const { email, password, confirmPassword, fullName} = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' }); 
  }

  try {
    const result = await auth.api.signUpEmail({
      body: { email, password, name: fullName }
    });

    if (!result || !result.user) {
      return res.status(400).json({ error: 'Failed to create user' });
    }

    const dbUser = await db.Users.upsert({
      where: { id: result.user.id },
      update: {
        name: fullName,
        email,
        role: ['admin']
      },
      create: {
        id: result.user.id,
        email,
        name: fullName,
        role: ['admin']
      }
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: result.user,
      token: result.token
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(err.statusCode || 500).json({
      error: err.body?.message || 'Failed to register user',
      details: err.message
    });
  }
});


//Sign in---------------------------------------------------------------------------------------------------------------------
authRouter.post('/sign-in/email', validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await auth.api.signInEmail({ body: { email, password } });

    if (!result || !result.user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const dbUser = await db.Users.findUnique({
      where: { email }
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000,
      path: '/'
    };

    // Sets the cookie
    res.cookie('better-auth.session_token', result.token, cookieOptions);

    res.status(200).json({
      message: 'Login successful. Welcome back',
      user: result.user,
      token: result.token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(err.statusCode || 401).json({
      error: err.body?.message || 'Invalid email or password'
    });
  }
});

//Logout-----------------------------------------------------------------------------------------------------------------------
authRouter.post('/sign-out', async (req, res) => {
  try {
    const token = req.cookies['better-auth.session_token'];

    res.clearCookie('better-auth.session_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    res.status(200).json({ message: 'User successfully signed out' });
  } catch (error) {
    console.error('Sign-out error:', error);
    res.status(500).json({ error: 'Failed to sign out' });
  } 
});

export default authRouter;