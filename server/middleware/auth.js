const jwt = require('jsonwebtoken');
const { query } = require('../database/config');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const result = await query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Check if user has required role
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

module.exports = {
  authenticateToken,
  requireRole,
  generateToken,
};
