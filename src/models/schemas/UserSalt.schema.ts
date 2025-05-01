import { ObjectId } from 'mongodb';

interface TypeOfUserSalt {
  _id?: ObjectId;
  user_id: string;
  salt: string;
}

export default class UserSalt {
  _id?: ObjectId;
  user_id: string;
  salt: string;

  constructor(userSalt: TypeOfUserSalt) {
    this.user_id = userSalt.user_id;
    this.salt = userSalt.salt;
  }
}
