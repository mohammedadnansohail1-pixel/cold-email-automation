const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'cold-email-automation' },
  transports: [
    // Write all logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message, ...meta }) =>
            `${timestamp} [${level}]: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
            }`
        )
      ),
    }),
  ],
});

// In production, also log to files
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
    })
  );
  logger.add(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
    })
  );
}

module.exports = logger;
