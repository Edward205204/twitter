export const TWEETS_MESSAGES = {
  SUCCESS: {
    CREATE_TWEET_SUCCESS: 'Create tweet successfully',
    GET_TWEET_SUCCESS: 'Get tweet successfully',
    GET_TWEET_CHILDREN_SUCCESS: 'Get tweet children successfully',
    GET_NEW_FEEDS_SUCCESS: 'Get new feeds successfully',
    SEARCH_SUCCESS: 'Search successfully'
  },
  VALIDATION: {
    TWEET_ID_IS_INVALID: 'Tweet id is invalid',
    INVALID_TYPE: 'Type is invalid',
    INVALID_AUDIENCE: 'Audience is invalid',
    PARENT_ID_MUST_BE_A_VALID_TWEET_ID: 'Parent_id must be a valid tweet id',
    PARENT_ID_MUST_BE_NULL: 'Parent_id must be null',
    CONTENT_MUST_BE_A_STRING: 'Content must be a string',
    CONTENT_MUST_BE_NULL: 'Content must be null',
    HASHTAGS_MUST_BE_AN_ARRAY_OF_STRING: 'Hashtags must be an array of string',
    CONTENT_MUST_BE_EMPTY_STRING: 'Content must be empty string',
    CONTENT_MUST_BE_A_NON_EMPTY_STRING: 'Content must be a non empty string',
    MENTIONS_MUST_BE_AN_ARRAY_OF_USER_ID: 'Mentions must be an array of user id',
    MEDIAS_MUST_BE_AN_ARRAY_OF_MEDIA_OBJECT: 'Medias must be an array of media object',
    TWEET_ID_NOT_FOUND: 'Tweet not found',
    USER_NOT_FOUND: 'User not found',
    USER_BANNED: 'User banned',
    CAN_NOT_ACCESS_TWEET: 'Can not access tweet',
    LIMIT_MUST_BE_A_NUMBER: 'Limit must be a number',
    PAGE_MUST_BE_A_NUMBER: 'Page must be a number',
    LIMIT_NOT_VALID: 'Limit must be between 1 and 100',
    PAGE_NOT_VALID: 'Page must be greater than 0'
  }
};
