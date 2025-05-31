import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const handler = context.getHandler().name;

    return next.handle().pipe(
      map((data) => {
        let message = 'Success';
        // Custom user-friendly messages based on handler
        switch (handler) {
          case 'create':
            message = 'User created successfully';
            break;
          case 'update':
            message = 'User updated successfully';
            break;
          case 'remove':
            message = 'User deleted successfully';
            break;
          case 'findAll':
            message = 'Users fetched successfully';
            break;
          case 'findOne':
            message = 'User fetched successfully';
            break;
        }
        return {
          message,
          success: true,
          payload: data?.payload !== undefined ? data.payload : data,
          meta: data?.meta || null,
        };
      }),
    );
  }
}
