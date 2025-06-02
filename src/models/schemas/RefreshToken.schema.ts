import { ObjectId } from 'mongodb';

interface RefreshTokenType {
  _id?: ObjectId;
  user_id: ObjectId;
  refresh_token: string;
  created_at?: Date;
  exp: number;
  iat: number;
}

class RefreshToken {
  _id?: ObjectId;
  user_id: ObjectId;
  refresh_token: string;
  created_at?: Date;
  exp: Date;
  iat: Date;

  constructor(refreshToken: RefreshTokenType) {
    this.user_id = refreshToken.user_id;
    this.refresh_token = refreshToken.refresh_token;
    this.created_at = refreshToken.created_at || new Date();
    this.exp = new Date(refreshToken.exp * 1000);
    this.iat = new Date(refreshToken.iat * 1000);
  }
}

export default RefreshToken;
