export const USER_MESSAGE = {
  // Auth messages
  AUTH: {
    LOGIN_SUCCESS: 'Login success',
    REGISTER_SUCCESS: 'Register success',
    LOGOUT_SUCCESS: 'Logout success',
    EMAIL_OR_PASSWORD_IS_INCORRECT: 'Email or password is incorrect',
    VERIFY_EMAIL_SUCCESS: 'Verify email success',
    SENDED_FORGOT_PASSWORD_TO_USER_EMAIL: 'Sended forgot password to user email',
    VALID_FORGOT_PASSWORD_TOKEN: 'Valid forgot password token',
    RESET_PASSWORD_SUCCESS: 'Reset password success',
    GET_ME_SUCCESS: 'Get me success',
    UPDATE_ACCOUNT_SUCCESS: 'Update account success',
    GET_PROFILE_SUCCESS: 'Get profile success',
    FOLLOWED_USER_SUCCESS: 'Followed user success',
    FOLLOWED_USER_ALREADY: 'Followed user already',
    UNFOLLOWED_USER_SUCCESS: 'Unfollowed user success',
    NOT_FOLLOWED_THIS_USER: 'Not followed this user'
  },

  // Validation messages
  VALIDATION: {
    NAME_IS_REQUIRED: 'Name is required',
    EMAIL_VERIFY_TOKEN_IS_REQUIRED: 'Email verify token is required',
    EMAIL_IS_NOT_REGISTERED: 'Email is not registered',
    NAME_MUST_BE_A_STRING: 'Name must be a string',
    NAME_LENGTH_MUST_BE_FROM_1_TO_100: 'Name length must be from 1 to 100',
    EMAIL_IS_REQUIRED: 'Email is required',
    EMAIL_ALREADY_EXISTS: 'Email already exists',
    EMAIL_IS_INVALID: 'Email is invalid',
    PASSWORD_IS_REQUIRED: 'Password is required',
    PASSWORD_MUST_BE_A_STRING: 'Password must be a string',
    PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: 'Password length must be from 6 to 50',
    PASSWORD_MUST_BE_STRONG:
      'Password must be 6-50 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol',
    CONFIRM_PASSWORD_IS_REQUIRED: 'Confirm password is required',
    CONFIRM_PASSWORD_MUST_BE_A_STRING: 'Confirm password must be a string',
    CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: 'Confirm password length must be from 6 to 50',
    CONFIRM_PASSWORD_MUST_BE_STRONG:
      'Confirm password must be 6-50 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 symbol',
    CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD: 'Confirm password must be the same as password',
    DATE_OF_BIRTH_MUST_BE_ISO8601: 'Date of birth must be ISO8601',
    VALIDATION_ERROR: 'Validation error',
    ACCOUNT_IS_NOT_VERIFIED: 'Account is not verified',
    BIO_MUST_BE_A_STRING: 'Bio must be a string',
    BIO_MUST_BE_LESS_THAN_200_CHARACTERS: 'Bio must be less than 200 characters',
    LOCATION_MUST_BE_A_STRING: 'Location must be a string',
    LOCATION_MUST_BE_LESS_THAN_100_CHARACTERS: 'Location must be less than 100 characters',
    WEBSITE_MUST_BE_A_STRING: 'Website must be a string',
    WEBSITE_MUST_BE_LESS_THAN_300_CHARACTERS: 'Website must be less than 300 characters',
    AVATAR_IMG_URL_MUST_BE_A_STRING: 'Avatar img url must be a string',
    AVATAR_IMG_URL_MUST_BE_LESS_THAN_400_CHARACTERS: 'Avatar img url must be less than 400 characters',
    USERNAME_MUST_BE_A_STRING: 'Username must be a string',
    USER_NAME_NOT_VALID:
      'Username must be 4 - 15 characters,not start with a number, and not contain special characters',
    FOLLOWED_USER_ID_MUST_BE_A_STRING: 'Followed user id must be a string',
    USER_ID_NOT_VALID: 'User id not valid',
    USERNAME_ALREADY_EXISTS: 'Username already exists',
    CANNOT_FOLLOW_OR_UNFOLLOW_YOURSELF: 'Cannot follow or unfollow yourself'
  },

  // Token messages
  TOKEN: {
    ACCESS_TOKEN_IS_REQUIRED: 'Access token is required',
    ACCESS_TOKEN_IS_INVALID: 'Access token is invalid',
    REFRESH_TOKEN_IS_REQUIRED: 'Refresh token is required',
    REFRESH_TOKEN_IS_INVALID: 'Refresh token is invalid',
    REFRESH_TOKEN_OR_NOT_EXIST: 'Used refresh token or not exist',
    EMAIL_IS_VERIFIED_BEFORE: 'Email is verified before',
    EMAIL_VERIFY_TOKEN_IS_NOT_EXIST_OR_NOT_MATCH: 'Token is not exist or not match',
    EMAIL_VERIFY_TOKEN_IS_RESENT: 'Email verify token is resent',
    FORGOT_PASSWORD_TOKEN_IS_REQUIRED: 'Forgot password token is required',
    FORGOT_PASSWORD_TOKEN_IS_INVALID: 'Forgot password token is invalid'
  },

  // Errors
  ERROR: {
    SALTS_NOT_FOUND: 'Salts not found',
    FAIL_TO_INSERT_USER: 'Failed to insert user into database',
    USER_NOT_FOUND: 'User not found'
  }
} as const;
