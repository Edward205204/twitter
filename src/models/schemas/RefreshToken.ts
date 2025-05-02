import { ObjectId } from 'mongodb';

interface RefreshTokenType {
  _id?: ObjectId;
  user_id: ObjectId;
  refresh_token: string;
  created_at?: Date;
}

class RefreshToken {
  _id?: ObjectId;
  user_id: ObjectId;
  refresh_token: string;
  created_at?: Date;

  constructor(refreshToken: RefreshTokenType) {
    this.user_id = refreshToken.user_id;
    this.refresh_token = refreshToken.refresh_token;
    this.created_at = refreshToken.created_at || new Date();
  }
}

export default RefreshToken;
