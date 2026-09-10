import winston from 'winston'
import { config } from './config.js'

/**
 * Usage:
 * import { logger } from "<path>/logger";
 * logger.debug('hello');
 * logger.info('hello');
 * logger.error('hello');
 */
export const logger = winston.createLogger({
  level: config.get('environment') === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
  ),
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
})

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (config.get('environment') != 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  )
}
