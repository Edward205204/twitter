import databaseService from './databases.services';
import { ObjectId } from 'mongodb';
import Bookmark from '~/models/schemas/Bookmark.schema';

class BookmarksService {
  async createBookmark(user_id: string, tweet_id: string) {
    const result = await databaseService.bookmarks.findOneAndUpdate(
      { user_id: new ObjectId(user_id), tweet_id: new ObjectId(tweet_id) },
      { $setOnInsert: new Bookmark({ user_id: new ObjectId(user_id), tweet_id: new ObjectId(tweet_id) }) },
      { upsert: true, returnDocument: 'after' }
    );
    return result;
  }

  // deleteBookmark(user_id: string, tweet_id: string) {
  //   return databaseService.bookmarks.deleteOne({
  //     user_id: new ObjectId(user_id),
  //     tweet_id: new ObjectId(tweet_id)
  //   });
  // }

  // deleteBookmarkByBookmarkId(user_id: string, bookmark_id: string) {
  //   return databaseService.bookmarks.deleteOne({
  //     user_id: new ObjectId(user_id),
  //     _id: new ObjectId(bookmark_id)
  //   });
  // }

  deleteBookmarkByFilter(user_id: string, filter: Partial<{ tweet_id: string; _id: string }>) {
    return databaseService.bookmarks.deleteOne({
      user_id: new ObjectId(user_id),
      [filter.tweet_id ? 'tweet_id' : '_id']: new ObjectId(filter.tweet_id || filter._id)
    });
  }
}

const bookmarksService = new BookmarksService();
export default bookmarksService;
