const bcrypt = require('bcryptjs');
const { query } = require('../database/config');
const { generateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Register new user
const register = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name } = req.validatedData;

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, role, created_at`,
      [email, password_hash, first_name, last_name, 'user']
    );

    const user = result.rows[0];
    const token = generateToken(user.id);

    logger.info('User registered successfully', { userId: user.id, email });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// Login user
const login = async (req, res, next) => {
  try {
    const { email, password } = req.validatedData;

    // Get user
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    const token = generateToken(user.id);

    logger.info('User logged in successfully', { userId: user.id, email });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// Get current user
const getCurrentUser = async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
};
