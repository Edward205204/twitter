import { checkSchema } from 'express-validator';
import { validate } from '~/utils/validate';
import { enumsToArray } from '~/utils/common';
import { MediaType, TweetAudience, TweetType, UserVerifyStatus } from '~/constants/enums';

import { ObjectId } from 'mongodb';
import { TWEETS_MESSAGES } from '~/constants/tweet.message';
import { isEmpty } from 'lodash';
import { HTTP_STATUS } from '~/constants/http_request';
import { ErrorWithStatus } from '~/models/Errors';
import databaseService from '~/services/databases.services';
import { NextFunction, Request, Response } from 'express';
import Tweet from '~/models/schemas/Tweets.schema';
import { TokenPayload } from '~/models/schemas/requests/User.request';
import { wrapRequestHandler } from '~/utils/handlers';

// const typeArray = enumsToArray(TweetType);
// const audienceArray = enumsToArray(TweetAudience);
// export const createTweetValidator = validate(
//   checkSchema({
//     type: {
//       isIn: {
//         options: [typeArray],
//         errorMessage: 'Type is invalid'
//       }
//     },
//     audience: {
//       isIn: {
//         options: [audienceArray],
//         errorMessage: 'Audience is invalid'
//       }
//     },

//     content: {
//       custom: {
//         // Nếu là tweet bình thường thì sẽ có content là string. Còn nếu là retweet thì sẽ không có content mà chỉ có parent_id thôi, lúc này có thể cho content là '' hoặc null, như mình phân tích ở những bài trước thì mình thích để '' hơn, đỡ phải phân tích trường hợp null. Vậy nên content có thể là string.
//         options: (value, { req }) => {
//           const type = req.body.type;
//           const parent_id = req.body.parent_id;
//           if ([TweetType.Tweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) && typeof value !== 'string') {
//             throw new ErrorWithStatus({
//               status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
//               message: 'Content must be a string'
//             });
//           }

//           // khi là retweet thì parent_id phải là một ObjectId hợp lệ
//           if (TweetType.Retweet && !ObjectId.isValid(parent_id)) {
//             throw new ErrorWithStatus({
//               status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
//               message: 'Parent_id is invalid'
//             });
//           }

//           //  khi là retweet(tức là tweet mà không nhập content) thì content phải là null
//           if (TweetType.Retweet && value !== null) {
//             throw new ErrorWithStatus({
//               status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
//               message: 'Retweet content must be null'
//             });
//           }

//           return true;
//         }
//       }
//     }
//   })
// );

const tweetTypes = enumsToArray(TweetType);
const tweetAudiences = enumsToArray(TweetAudience);
const mediaTypes = enumsToArray(MediaType);
export const createTweetValidator = validate(
  checkSchema({
    type: {
      isIn: {
        options: [tweetTypes],
        errorMessage: TWEETS_MESSAGES.VALIDATION.INVALID_TYPE
      }
    },
    audience: {
      isIn: {
        options: [tweetAudiences],
        errorMessage: TWEETS_MESSAGES.VALIDATION.INVALID_AUDIENCE
      }
    },
    parent_id: {
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType;
          // Nếu `type` là retweet, comment, quotetweet thì `parent_id` phải là `tweet_id` của tweet cha
          if ([TweetType.Retweet, TweetType.Comment, TweetType.QuoteTweet].includes(type) && !ObjectId.isValid(value)) {
            throw new Error(TWEETS_MESSAGES.VALIDATION.PARENT_ID_MUST_BE_A_VALID_TWEET_ID);
          }
          // nếu `type` là tweet thì `parent_id` phải là `null`
          if (type === TweetType.Tweet && value !== null) {
            throw new Error(TWEETS_MESSAGES.VALIDATION.PARENT_ID_MUST_BE_NULL);
          }
          return true;
        }
      }
    },
    content: {
      isString: true,
      custom: {
        options: (value, { req }) => {
          const type = req.body.type as TweetType;
          const hashtags = req.body.hashtags as string[];
          const mentions = req.body.mentions as string[];
          // Nếu `type` là comment, quotetweet, tweet và không có `mentions` và `hashtags` thì `content` phải là string và không được rỗng
          if (
            [TweetType.Comment, TweetType.QuoteTweet, TweetType.Tweet].includes(type) &&
            isEmpty(hashtags) &&
            isEmpty(mentions) &&
            value === ''
          ) {
            throw new Error(TWEETS_MESSAGES.VALIDATION.CONTENT_MUST_BE_A_NON_EMPTY_STRING);
          }
          // Nếu `type` là retweet thì `content` phải là `''`.
          if (type === TweetType.Retweet && value !== '') {
            throw new Error(TWEETS_MESSAGES.VALIDATION.CONTENT_MUST_BE_EMPTY_STRING);
          }
          return true;
        }
      }
    },
    hashtags: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          if (value.some((item: any) => typeof item !== 'string')) {
            throw new Error(TWEETS_MESSAGES.VALIDATION.HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING);
          }
          return true;
        }
      }
    },
    mentions: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // Yêu cầu mỗi phần từ trong array là user_id
          if (value.some((item: any) => !ObjectId.isValid(item))) {
            throw new Error(TWEETS_MESSAGES.VALIDATION.MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID);
          }
          return true;
        }
      }
    },
    medias: {
      isArray: true,
      custom: {
        options: (value, { req }) => {
          // Yêu cầu mỗi phần từ trong array là Media Object
          if (
            value.some((item: any) => {
              return typeof item.url !== 'string' || !mediaTypes.includes(item.type);
            })
          ) {
            throw new Error(TWEETS_MESSAGES.VALIDATION.MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT);
          }
          return true;
        }
      }
    }
  })
);

export const tweetIdValidator = validate(
  checkSchema(
    {
      tweet_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: TWEETS_MESSAGES.VALIDATION.TWEET_ID_IS_INVALID
              });
            }

            const [tweet] = await databaseService.tweets
              .aggregate<Tweet>([
                {
                  $match: {
                    _id: new ObjectId('64af9f2b93bfcdef3324de6f')
                  }
                },
                {
                  $lookup: {
                    from: 'hashtags',
                    localField: 'hashtags',
                    foreignField: '_id',
                    as: 'hashtags'
                  }
                },
                {
                  $lookup: {
                    from: 'users',
                    localField: 'mentions',
                    foreignField: '_id',
                    as: 'mentions'
                  }
                },
                {
                  $addFields: {
                    mentions: {
                      $map: {
                        input: '$mentions',
                        as: 'mention',
                        in: {
                          _id: '$$mention._id',
                          name: '$$mention.name',
                          username: '$$mention.username',
                          email: '$$mention.email'
                        }
                      }
                    }
                  }
                },
                {
                  $lookup: {
                    from: 'bookmarks',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'bookmarks'
                  }
                },
                {
                  $lookup: {
                    from: 'likes',
                    localField: '_id',
                    foreignField: 'tweet_id',
                    as: 'likes'
                  }
                },
                {
                  $lookup: {
                    from: 'tweets',
                    localField: '_id',
                    foreignField: 'parent_id',
                    as: 'tweet_children'
                  }
                },
                {
                  $addFields: {
                    bookmarks: {
                      $size: '$bookmarks'
                    },
                    likes: {
                      $size: '$likes'
                    },
                    retweet_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', 1]
                          }
                        }
                      }
                    },
                    comment_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', 2]
                          }
                        }
                      }
                    },
                    quote_count: {
                      $size: {
                        $filter: {
                          input: '$tweet_children',
                          as: 'item',
                          cond: {
                            $eq: ['$$item.type', 3]
                          }
                        }
                      }
                    }
                  }
                },
                {
                  $project: {
                    tweet_children: 0
                  }
                }
              ])
              .toArray();

            if (!tweet) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: TWEETS_MESSAGES.VALIDATION.TWEET_ID_NOT_FOUND
              });
            }
            (req as Request).tweet = tweet;
            return true;
          }
        }
      }
    },
    ['body', 'params']
  )
);

export const audienceValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const tweet = req.tweet as Tweet;

  if (tweet.audience === TweetAudience.TwitterCircle) {
    console.log('tweet_circle');
    const author_id = tweet.user_id;
    const user_id = (req.decoded_authorization as TokenPayload).user_id;

    const [user, author] = await Promise.all([
      databaseService.users.findOne({
        _id: new ObjectId(user_id)
      }),
      databaseService.users.findOne({
        _id: new ObjectId(author_id)
      })
    ]);

    if (!user || !author) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: TWEETS_MESSAGES.VALIDATION.USER_NOT_FOUND
      });
    }

    if (author.verify === UserVerifyStatus.Banned) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: TWEETS_MESSAGES.VALIDATION.USER_BANNED
      });
    }

    const isInAudientCircle = author.tweet_circle.some((tweet_circle_id) => {
      return tweet_circle_id.equals(user._id);
    });

    if (!isInAudientCircle && !user._id.equals(author._id)) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: TWEETS_MESSAGES.VALIDATION.CAN_NOT_ACCESS_TWEET
      });
    }
  }
  next();
});
