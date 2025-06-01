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
    const handler = context.getHandler().name;
    const controller = context.getClass().name;

    return next.handle().pipe(
      map((data) => {
        let message = 'Success';
        // Custom user-friendly messages based on controller and handler
        if (controller === 'RoomsController') {
          switch (handler) {
            case 'create':
              message = 'Room created successfully';
              break;
            case 'update':
              message = 'Room updated successfully';
              break;
            case 'remove':
              message = 'Room deleted successfully';
              break;
            case 'findAll':
              message = 'Rooms fetched successfully';
              break;
            case 'findOne':
              message = 'Room fetched successfully';
              break;
          }
        } else if (controller === 'ReservationsController') {
          switch (handler) {
            case 'create':
              message = 'Reservation created successfully';
              break;
            case 'update':
              message = 'Reservation updated successfully';
              break;
            case 'remove':
              message = 'Reservation deleted successfully';
              break;
            case 'findAll':
              message = 'Reservations fetched successfully';
              break;
            case 'findOne':
              message = 'Reservation fetched successfully';
              break;
          }
        } else {
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
