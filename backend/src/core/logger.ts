import winston from 'winston';
import { config } from './config.js';

const isProduction = config.get('environment') === 'production';

const logFormat = winston.format.combine(
  winston.format.errors({ stack: true }),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const details = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';

    return `${timestamp} ${level}: ${stack ?? message}${details}`;
  }),
);

export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: logFormat,

  transports: [
    new winston.transports.Console({
      stderrLevels: ['error'],
    }),
  ],
});
