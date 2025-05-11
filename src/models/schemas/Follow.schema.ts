import { ObjectId } from 'mongodb';

interface FollowType {
  _id?: ObjectId;
  user_id: ObjectId;
  followed_user_id: ObjectId;
  created_at?: Date;
}

class Follow {
  _id?: ObjectId;
  user_id: ObjectId;
  followed_user_id: ObjectId;
  created_at?: Date;

  constructor(follow: FollowType) {
    this.user_id = follow.user_id;
    this.followed_user_id = follow.followed_user_id;
    this.created_at = follow.created_at || new Date();
  }
}

export default Follow;
