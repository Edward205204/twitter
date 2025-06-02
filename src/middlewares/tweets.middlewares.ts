import { checkSchema } from 'express-validator';
import { validate } from '~/utils/validate';
import { enumsToArray } from '~/utils/common';
import { MediaType, TweetAudience, TweetType } from '~/constants/enums';

import { ObjectId } from 'mongodb';
import { TWEETS_MESSAGES } from '~/constants/tweet.mesage';
import { isEmpty } from 'lodash';

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
