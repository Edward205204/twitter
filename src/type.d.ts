import { Request } from 'express';
import User from '~/models/schemas/User.schema';
import { TokenPayload } from './models/schemas/requests/User.request';
declare module 'express' {
  interface Request {
    user?: User;
    decoded_authorization?: TokenPayload; // payload tự định nghĩa thêm và kế thừa từ JwtPayload
    decoded_refresh_token?: TokenPayload;
  }
}
