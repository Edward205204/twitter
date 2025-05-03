import { JwtPayload } from 'jsonwebtoken';
import { TokenType } from '~/constants/token_type';

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
