import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl } = req;
    const user = req.user ? JSON.stringify(req.user) : 'Guest';
    const start = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length');
      const duration = Date.now() - start;
      this.logger.log(
        `${method} ${originalUrl} ${statusCode} - ${contentLength || 0}b sent - User: ${user} - ${duration}ms`,
      );
    });

    next();
  }
}
