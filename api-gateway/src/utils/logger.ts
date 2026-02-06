import winston from 'winston';
import config from '@microservices/config';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format
const customFormat = printf(({ level, message, timestamp, stack, service }) => {
  const serviceTag = service ? `[${service}]` : '[API-Gateway]';
  if (stack) {
    return `${timestamp} ${serviceTag} [${level}]: ${message}\n${stack}`;
  }
  return `${timestamp} ${serviceTag} [${level}]: ${message}`;
});

// Create logger
const logger = winston.createLogger({
  level: config.logging.level,
  defaultMeta: { service: 'api-gateway' },
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat
  ),
  transports: [
    // Console
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), customFormat),
    }),
    // File for errors
    new winston.transports.File({
      filename: 'logs/gateway-error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined file
    new winston.transports.File({
      filename: 'logs/gateway-combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

export default logger;