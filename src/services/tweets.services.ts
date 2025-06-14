import HashTag from '~/models/schemas/HashTags.schema';

import { TweetRequestBody } from '~/models/schemas/requests/Tweet.request';
import databaseService from './databases.services';
import Tweet from '~/models/schemas/Tweets.schema';
import { ObjectId } from 'mongodb';

class TweetsService {
  async checkAndCreateHashTag(hashtags: string[]) {
    const hashtagList = await Promise.all(
      hashtags.map(async (hashtag) => {
        const res = await databaseService.hashtags.findOneAndUpdate(
          { name: hashtag },
          { $setOnInsert: new HashTag({ name: hashtag }) },
          { upsert: true, returnDocument: 'after' }
        );

        return res;
      })
    );
    return hashtagList.map((res) => res?._id).filter((hashtag) => hashtag !== undefined);
  }

  async createTweet({ body, user_id }: { body: TweetRequestBody; user_id: string }) {
    const hashtags = await this.checkAndCreateHashTag(body.hashtags);

    const res = await databaseService.tweets.insertOne(
      new Tweet({
        user_id: new ObjectId(user_id),
        parent_id: body.parent_id,
        mentions: [],
        audience: body.audience,
        type: body.type,
        hashtags: hashtags,
        medias: [],
        content: body.content
      })
    );

    const result = await databaseService.tweets.findOne({ _id: res.insertedId });
    return result;
  }
}

const tweetsService = new TweetsService();
export default tweetsService;
