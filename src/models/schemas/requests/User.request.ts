import { JwtPayload } from 'jsonwebtoken';
import { TokenType } from '~/constants/token_type';
import User from '../User.schema';

// dùng để làm generic cho các request

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  date_of_birth: string;
}

export interface TokenPayload extends JwtPayload {
  user_id: string;
  token_type: TokenType;
}

export interface LogoutReqBody {
  refresh_token: string;
}

export interface ForgotPasswordReqBody {
  user: User;
}

/**
 * @description định nghĩa các trường được gửi lên bằng method POST của request(thuộc route /reset-password)
 */
export interface ResetPasswordReqBody {
  password: string;
  confirm_password: string;
  forgot_password_token: string;
}
