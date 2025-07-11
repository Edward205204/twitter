import { ObjectId, WithId } from 'mongodb';
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enums';
import { TweetRequestBody } from '~/models/schemas/requests/Tweet.request';
import { RegisterRequest } from '~/models/schemas/requests/User.request';
import Follower from '~/models/schemas/Follow.schema';
import Hashtag from '~/models/schemas/HashTags.schema';
import Tweet from '~/models/schemas/Tweets.schema';
import User from '~/models/schemas/User.schema';
import databaseService from '~/services/databases.services';
import { hashPassword } from '~/utils/crypto';
import { faker } from '@faker-js/faker';

/**
 * Yêu cầu: Mọi người phải cài đặt `@faker-js/faker` vào project
 * Cài đặt: `npm i @faker-js/faker`
 */

// Mật khẩu cho các fake user
const PASSWORD = 'DayLaTaiKhoanCloneNe';
// ID của tài khoản của mình, dùng để follow người khác
const MYID = new ObjectId('6843f439e62d5171c833b67b');

// Số lượng user được tạo, mỗi user sẽ mặc định tweet 2 cái
const USER_COUNT = 500;

const createRandomUser = () => {
  const user: RegisterRequest = {
    name: faker.internet.displayName(),
    email: faker.internet.email(),
    password: PASSWORD,
    confirm_password: PASSWORD,
    date_of_birth: faker.date.past().toISOString()
  };
  return user;
};

const createRandomTweet = () => {
  const tweet: TweetRequestBody = {
    type: TweetType.Tweet,
    audience: TweetAudience.Everyone,
    content: faker.lorem.paragraph({
      min: 10,
      max: 160
    }),
    hashtags: ['NodeJS', 'MongoDB', 'ExpressJS', 'Swagger', 'Docker', 'Socket.io'],
    medias: [
      {
        type: MediaType.Image,
        url: faker.image.url()
      }
    ],
    mentions: [],
    parent_id: null
  };
  return tweet;
};
const users: RegisterRequest[] = faker.helpers.multiple(createRandomUser, {
  count: USER_COUNT
});

const insertMultipleUsers = async (users: RegisterRequest[]) => {
  console.log('Creating users...');
  const result = await Promise.all(
    users.map(async (user) => {
      const user_id = new ObjectId();
      const { password, salt } = await hashPassword({ password: user.password });
      await databaseService.users.insertOne(
        new User({
          ...user,
          _id: user_id,
          username: `user${user_id.toString()}`,
          password,
          date_of_birth: new Date(user.date_of_birth),
          verify: UserVerifyStatus.Verified,
          salt
        })
      );
      return user_id;
    })
  );
  console.log(`Created ${result.length} users`);
  return result;
};

const followMultipleUsers = async (user_id: ObjectId, followed_user_ids: ObjectId[]) => {
  console.log('Start following...');
  const result = await Promise.all(
    followed_user_ids.map((followed_user_id) =>
      databaseService.follows.insertOne(
        new Follower({
          user_id,
          followed_user_id: new ObjectId(followed_user_id)
        })
      )
    )
  );
  console.log(`Followed ${result.length} users`);
};

const checkAndCreateHashtags = async (hashtags: string[]) => {
  const hashtagDocuments = await Promise.all(
    hashtags.map((hashtag) => {
      // Tìm hashtag trong database, nếu có thì lấy, không thì tạo mới
      return databaseService.hashtags.findOneAndUpdate(
        { name: hashtag },
        {
          $setOnInsert: new Hashtag({ name: hashtag })
        },
        {
          upsert: true,
          returnDocument: 'after'
        }
      );
    })
  );
  return hashtagDocuments.map((hashtag) => (hashtag as WithId<Hashtag>)._id);
};

const insertTweet = async (user_id: ObjectId, body: TweetRequestBody) => {
  const hashtags = await checkAndCreateHashtags(body.hashtags);
  const result = await databaseService.tweets.insertOne(
    new Tweet({
      audience: body.audience,
      content: body.content,
      hashtags,
      mentions: body.mentions,
      medias: body.medias,
      parent_id: body.parent_id,
      type: body.type,
      user_id: new ObjectId(user_id)
    })
  );
  return result;
};

const insertMultipleTweets = async (ids: ObjectId[]) => {
  console.log('Creating tweets...');
  console.log(`Counting...`);
  let count = 0;
  const result = await Promise.all(
    ids.map(async (id, index) => {
      await Promise.all([insertTweet(id, createRandomTweet()), insertTweet(id, createRandomTweet())]);
      count += 2;
      console.log(`Created ${count} tweets`);
    })
  );
  return result;
};

insertMultipleUsers(users).then((ids) => {
  followMultipleUsers(new ObjectId(MYID), ids).catch((err) => {
    console.error('Error when following users');
    console.log(err);
  });
  insertMultipleTweets(ids).catch((err) => {
    console.error('Error when creating tweets');
    console.log(err);
  });
});
