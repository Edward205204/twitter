import HashTag from '~/models/schemas/HashTags.schema';

import { TweetRequestBody } from '~/models/schemas/requests/Tweet.request';
import databaseService from './databases.services';
import Tweet from '~/models/schemas/Tweets.schema';
import { ObjectId, WithId } from 'mongodb';
import { TweetType } from '~/constants/enums';

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
        mentions: [...body.mentions],
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

  async increaseView(tweet_id: string, user_id?: string) {
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 };
    const tweet = await databaseService.tweets.findOneAndUpdate(
      { _id: new ObjectId(tweet_id) },
      {
        $inc: inc,
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          guest_views: 1,
          user_views: 1,
          updated_at: 1
        }
      }
    );
    return tweet as WithId<{
      guest_views: number;
      user_views: number;
      updated_at: Date;
    }>;
  }

  async getTweetChildren({
    tweet_id,
    tweet_type,
    tweet_limit,
    tweet_page,
    user_id
  }: {
    tweet_id: string;
    tweet_type: TweetType;
    tweet_limit: number;
    tweet_page: number;
    user_id?: string;
  }) {
    const tweets = await databaseService.tweets
      .aggregate([
        {
          $match: {
            type: tweet_type,
            parent_id: new ObjectId(tweet_id)
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
            comment_count: {
              $size: {
                $filter: {
                  input: '$tweet_children',
                  as: 'item',
                  cond: {
                    $eq: ['$$item.type', TweetType.Comment]
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
                    $eq: ['$$item.type', TweetType.QuoteTweet]
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
        },
        {
          $skip: (tweet_page - 1) * tweet_limit
        },
        {
          $limit: tweet_limit
        }
      ])
      .toArray();

    const total = await databaseService.tweets.countDocuments({
      type: tweet_type,
      parent_id: new ObjectId(tweet_id)
    });
    const ids = tweets.map((tweet) => tweet._id);
    const date = new Date();
    const inc = user_id ? { user_views: 1 } : { guest_views: 1 };
    await databaseService.tweets.updateMany({ _id: { $in: ids } }, { $inc: inc, $set: { updated_at: date } });

    tweets.forEach((tweet) => {
      tweet.updated_at = date;
      if (user_id) {
        tweet.user_views = tweet.user_views + 1;
      } else {
        tweet.guest_views = tweet.guest_views + 1;
      }
    });
    return {
      tweets,
      total
    };
  }

  // async getNewFeeds({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {
  //   const user_id_obj = new ObjectId(user_id);
  //   const followed_user_ids = await databaseService.follows
  //     .find(
  //       { user_id: user_id_obj },
  //       {
  //         projection: {
  //           followed_user_id: 1
  //         }
  //       }
  //     )
  //     .toArray();

  //   const ids: ObjectId[] = followed_user_ids.map((user) => user.followed_user_id);
  //   ids.push(user_id_obj); // thêm id của chính mình để feed gồm cả người mình follow và tweet của mình
  //   const tweets = await databaseService.tweets
  //     .aggregate([
  //       {
  //         $match: {
  //           user_id: {
  //             $in: ids
  //           }
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: 'users',
  //           localField: 'user_id',
  //           foreignField: '_id',
  //           as: 'user'
  //         }
  //       },
  //       {
  //         $unwind: {
  //           path: '$user'
  //         }
  //       },
  //       {
  //         $match: {
  //           $or: [
  //             {
  //               audience: 0
  //             },
  //             {
  //               $and: [
  //                 {
  //                   audience: 1
  //                 },
  //                 {
  //                   'user.twitter_circle': {
  //                     $in: [user_id_obj]
  //                   }
  //                 }
  //               ]
  //             }
  //           ]
  //         }
  //       },
  //       {
  //         $skip: limit * (page - 1) // Công thức phân trang
  //       },
  //       {
  //         $limit: limit
  //       },
  //       {
  //         $lookup: {
  //           from: 'hashtags',
  //           localField: 'hashtags',
  //           foreignField: '_id',
  //           as: 'hashtags'
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: 'users',
  //           localField: 'mentions',
  //           foreignField: '_id',
  //           as: 'mentions'
  //         }
  //       },
  //       {
  //         $addFields: {
  //           mentions: {
  //             $map: {
  //               input: '$mentions',
  //               as: 'mention',
  //               in: {
  //                 _id: '$$mention._id',
  //                 name: '$$mention.name',
  //                 username: '$$mention.username',
  //                 email: '$$mention.email'
  //               }
  //             }
  //           }
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: 'bookmarks',
  //           localField: '_id',
  //           foreignField: 'tweet_id',
  //           as: 'bookmarks'
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: 'likes',
  //           localField: '_id',
  //           foreignField: 'tweet_id',
  //           as: 'likes'
  //         }
  //       },
  //       {
  //         $lookup: {
  //           from: 'tweets',
  //           localField: '_id',
  //           foreignField: 'parent_id',
  //           as: 'tweet_children'
  //         }
  //       },
  //       {
  //         $addFields: {
  //           bookmarks: {
  //             $size: '$bookmarks'
  //           },
  //           likes: {
  //             $size: '$likes'
  //           },
  //           retweet_count: {
  //             $size: {
  //               $filter: {
  //                 input: '$tweet_children',
  //                 as: 'item',
  //                 cond: {
  //                   $eq: ['$$item.type', TweetType.Retweet]
  //                 }
  //               }
  //             }
  //           },
  //           comment_count: {
  //             $size: {
  //               $filter: {
  //                 input: '$tweet_children',
  //                 as: 'item',
  //                 cond: {
  //                   $eq: ['$$item.type', TweetType.Comment]
  //                 }
  //               }
  //             }
  //           },
  //           quote_count: {
  //             $size: {
  //               $filter: {
  //                 input: '$tweet_children',
  //                 as: 'item',
  //                 cond: {
  //                   $eq: ['$$item.type', TweetType.QuoteTweet]
  //                 }
  //               }
  //             }
  //           }
  //         }
  //       },
  //       {
  //         $project: {
  //           tweet_children: 0,
  //           user: {
  //             password: 0,
  //             email_verify_token: 0,
  //             forgot_password_token: 0,
  //             twitter_circle: 0,
  //             date_of_birth: 0
  //           }
  //         }
  //       }
  //     ])
  //     .toArray();

  //   const total = await databaseService.tweets
  //     .aggregate([
  //       {
  //         $match: {
  //           user_id: {
  //             $in: ids
  //           }
  //         }
  //       }
  //     ])
  //     .toArray();

  //   const date = new Date();
  //   const tweetsId = tweets.map((tweet) => tweet._id);
  //   await databaseService.tweets.updateMany(
  //     { _id: { $in: tweetsId } },
  //     { $inc: { user_views: 1 }, $set: { updated_at: date } }
  //   );

  //   tweets.forEach((tweet) => {
  //     tweet.updated_at = date;
  //     tweet.user_views = tweet.user_views + 1;
  //   });
  //   return {
  //     tweets,
  //     total: total.length
  //   };
  // }

  async getNewFeeds({ user_id, limit, page }: { user_id: string; limit: number; page: number }) {
    const user_id_obj = new ObjectId(user_id);
    const followed_user_ids = await databaseService.follows
      .find(
        {
          user_id: user_id_obj
        },
        {
          projection: {
            followed_user_id: 1,
            _id: 0
          }
        }
      )
      .toArray();
    const ids = followed_user_ids.map((item) => item.followed_user_id);

    ids.push(user_id_obj);
    const [tweets, total] = await Promise.all([
      databaseService.tweets
        .aggregate([
          {
            $match: {
              user_id: {
                $in: ids
              }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: {
              path: '$user'
            }
          },
          {
            $match: {
              $or: [
                {
                  audience: 0
                },
                {
                  $and: [
                    {
                      audience: 1
                    },
                    {
                      'user.twitter_circle': {
                        $in: [user_id_obj]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $skip: limit * (page - 1) // Công thức phân trang
          },
          {
            $limit: limit
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
                      $eq: ['$$item.type', TweetType.Retweet]
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
                      $eq: ['$$item.type', TweetType.Comment]
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
                      $eq: ['$$item.type', TweetType.QuoteTweet]
                    }
                  }
                }
              }
            }
          },
          {
            $project: {
              tweet_children: 0,
              user: {
                password: 0,
                email_verify_token: 0,
                forgot_password_token: 0,
                tweet_circle: 0,
                date_of_birth: 0,
                salt: 0
              }
            }
          }
        ])
        .toArray(),
      databaseService.tweets
        .aggregate([
          {
            $match: {
              user_id: {
                $in: ids
              }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: 'user_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          {
            $unwind: {
              path: '$user'
            }
          },
          {
            $match: {
              $or: [
                {
                  audience: 0
                },
                {
                  $and: [
                    {
                      audience: 1
                    },
                    {
                      'user.twitter_circle': {
                        $in: [user_id_obj]
                      }
                    }
                  ]
                }
              ]
            }
          },
          {
            $count: 'total'
          }
        ])
        .toArray()
    ]);
    const tweet_ids = tweets.map((tweet) => tweet._id as ObjectId);
    const date = new Date();
    await databaseService.tweets.updateMany(
      {
        _id: {
          $in: tweet_ids
        }
      },
      {
        $inc: { user_views: 1 },
        $set: {
          updated_at: date
        }
      }
    );

    tweets.forEach((tweet) => {
      tweet.updated_at = date;
      tweet.user_views += 1;
    });
    return {
      tweets,
      total: total[0].total
    };
  }
}

const tweetsService = new TweetsService();
export default tweetsService;
