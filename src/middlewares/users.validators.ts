import { checkSchema } from 'express-validator';
import { JsonWebTokenError } from 'jsonwebtoken';
import { HTTP_STATUS } from '~/constants/http_request';
import { USER_MESSAGE } from '~/constants/user_message';
import { ErrorWithStatus } from '~/models/Errors';
import usersService from '~/services/users.services';
import { hashPassword } from '~/utils/crypto';
import { verifyToken } from '~/utils/jwt';
import { validate } from '~/utils/validate';
import capitalize from 'lodash/capitalize';
import databaseService from '~/services/databases.services';
import { Request } from 'express-validator/lib/base';

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USER_MESSAGE.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USER_MESSAGE.EMAIL_IS_INVALID
        },
        custom: {
          options: async (value, { req }) => {
            const user = await usersService.checkEmailExist(value);
            if (!user) {
              throw new Error(USER_MESSAGE.EMAIL_OR_PASSWORD_IS_INCORRECT);
            }
            const passwordHash = await hashPassword({ password: req.body.password, salt: user.salt });
            if (passwordHash.password !== user.password) {
              throw new Error(USER_MESSAGE.EMAIL_OR_PASSWORD_IS_INCORRECT);
            }
            req.user = user;
            return true;
          }
        },
        trim: true
      },
      password: {
        notEmpty: {
          errorMessage: USER_MESSAGE.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USER_MESSAGE.PASSWORD_MUST_BE_A_STRING
        },
        isStrongPassword: {
          options: { minLength: 6, minUppercase: 1, minLowercase: 1, minNumbers: 1, minSymbols: 1 },
          errorMessage: USER_MESSAGE.PASSWORD_MUST_BE_STRONG
        }
      }
    },
    ['body']
  )
);

/**
 * -  Đây chỉ là nơi khai báo schema, không phải là nơi tiến hành validate
 * -  Để tiến hành validate thì cần phải run() nó ở middleware
 * -  Để lấy được kết quả validate thì cần phải sử dụng method validationResult() của express-validator
 * -  Hàm validate() bọc schema chính là một hàm return ra một middleware, và middleware này sẽ được sử dụng trong route
 */
export const registerValidator = validate(
  checkSchema(
    {
      name: {
        notEmpty: { errorMessage: USER_MESSAGE.NAME_IS_REQUIRED },
        isString: { errorMessage: USER_MESSAGE.NAME_MUST_BE_A_STRING },
        isLength: {
          options: { min: 1, max: 100 },
          errorMessage: USER_MESSAGE.NAME_LENGTH_MUST_BE_FROM_1_TO_100
        },
        trim: true
      },
      email: {
        notEmpty: {
          errorMessage: USER_MESSAGE.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USER_MESSAGE.EMAIL_IS_INVALID
        },
        custom: {
          options: async (value) => {
            const isEmailExist = await usersService.checkEmailExist(value);
            if (isEmailExist) {
              throw new Error(USER_MESSAGE.EMAIL_ALREADY_EXISTS);
            }
            return true;
          }
        },
        trim: true
      },
      password: {
        notEmpty: {
          errorMessage: USER_MESSAGE.PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USER_MESSAGE.PASSWORD_MUST_BE_A_STRING
        },
        isStrongPassword: {
          options: { minLength: 6, minUppercase: 1, minLowercase: 1, minNumbers: 1, minSymbols: 1 },
          errorMessage: USER_MESSAGE.PASSWORD_MUST_BE_STRONG
        }
      },
      confirm_password: {
        notEmpty: {
          errorMessage: USER_MESSAGE.CONFIRM_PASSWORD_IS_REQUIRED
        },
        isString: {
          errorMessage: USER_MESSAGE.CONFIRM_PASSWORD_MUST_BE_A_STRING
        },
        isStrongPassword: {
          options: { minLength: 6, minUppercase: 1, minLowercase: 1, minNumbers: 1, minSymbols: 1 },
          errorMessage: USER_MESSAGE.CONFIRM_PASSWORD_MUST_BE_STRONG
        },
        custom: {
          options: (value, { req }) => {
            if (value !== req.body.password) {
              throw new Error(USER_MESSAGE.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD);
            }
            return true;
          }
        }
      },
      date_of_birth: {
        isISO8601: {
          options: { strict: true, strictSeparator: true },
          errorMessage: USER_MESSAGE.DATE_OF_BIRTH_MUST_BE_ISO8601
        }
      }
    },
    ['body']
  )
);

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USER_MESSAGE.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }
            value = value.split(' ')[1];
            try {
              const decoded_authorization = await verifyToken({ token: value });
              (req as Request).decoded_authorization = decoded_authorization;
            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }
            return true;
          }
        }
      }
    },
    ['headers']
  )
);

export const refreshTokenValidate = validate(
  checkSchema(
    {
      refresh_token: {
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USER_MESSAGE.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              });
              // Không gửi refresh token khi logout
            }

            try {
              const [decoded_refresh_token, refreshToken] = await Promise.all([
                verifyToken({ token: value }),
                databaseService.refresh_tokens.findOne({ refresh_token: value })
              ]);

              // không cần thiết check decoded refresh token vì nó đã xử lý ở catch rồi

              if (!refreshToken)
                throw new ErrorWithStatus({
                  message: USER_MESSAGE.REFRESH_TOKEN_OR_NOT_EXIST,
                  status: HTTP_STATUS.UNAUTHORIZED
                });
              (req as Request).decoded_refresh_token = decoded_refresh_token;
            } catch (error) {
              // Nếu lúc giải mã token mà bị lỗi thì sẽ ném ra lỗi này
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize(error.message),
                  status: HTTP_STATUS.UNAUTHORIZED
                });
              }

              // Còn lỗi từ throw từ try sẽ được ném ra ở đây
              throw error;
            }
            return true;
          }
        }
      }
    },
    ['body']
  )
);
