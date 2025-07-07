import Like from '~/models/schemas/Like.schema';
import databaseService from './databases.services';
import { ObjectId } from 'mongodb';

class LikesService {
  async createLike(user_id: string, tweet_id: string) {
    const data = await databaseService.likes.findOneAndUpdate(
      { user_id: new ObjectId(user_id), tweet_id: new ObjectId(tweet_id) },
      { $setOnInsert: new Like({ user_id: new ObjectId(user_id), tweet_id: new ObjectId(tweet_id) }) },
      { upsert: true, returnDocument: 'after' }
    );
    return data;
  }

  // deleteLike(user_id: string, tweet_id: string) {
  //   return databaseService.likes.deleteOne({
  //     user_id: new ObjectId(user_id),
  //     tweet_id: new ObjectId(tweet_id)
  //   });
  // }

  deleteLikeByFilter(user_id: string, filter: Partial<{ tweet_id: string; _id: string }>) {
    return databaseService.likes.deleteOne({
      user_id: new ObjectId(user_id),
      [filter.tweet_id ? 'tweet_id' : '_id']: new ObjectId(filter.tweet_id || filter._id)
    });
  }
}

const likesService = new LikesService();
export default likesService;
