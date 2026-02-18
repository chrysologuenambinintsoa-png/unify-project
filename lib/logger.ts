/**
 * Logger utility for server-side logging
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  callId?: string;
  userId?: string;
  action?: string;
  [key: string]: any;
}

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = 'info') {
    this.level = (process.env.LOG_LEVEL as LogLevel) || level;
  }

  private formatMessage(message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? JSON.stringify(context) : '';
    return `[${timestamp}] ${message} ${contextStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage(`[DEBUG] ${message}`, context));
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage(`[INFO] ${message}`, context));
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage(`[WARN] ${message}`, context));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    if (this.shouldLog('error')) {
      const errorMessage =
        error instanceof Error ? error.message : JSON.stringify(error);
      console.error(
        this.formatMessage(`[ERROR] ${message}: ${errorMessage}`, context)
      );
    }
  }
}

export const logger = new Logger();
