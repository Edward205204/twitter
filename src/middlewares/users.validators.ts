import { checkSchema, ParamSchema } from 'express-validator';
import { JsonWebTokenError } from 'jsonwebtoken';
import { HTTP_STATUS } from '~/constants/http_request';
import { USER_MESSAGE } from '~/constants/user.message';
import { ErrorWithStatus } from '~/models/Errors';
import usersService from '~/services/users.services';
import { hashPassword } from '~/utils/crypto';
import { verifyToken } from '~/utils/jwt';
import { validate } from '~/utils/validate';
import capitalize from 'lodash/capitalize';
import databaseService from '~/services/databases.services';
import { ObjectId } from 'mongodb';
import User from '~/models/schemas/User.schema';
import { UserVerifyStatus } from '~/constants/enums';
import { NextFunction, Request, Response } from 'express';
import { isLength } from 'lodash';
import { TokenPayload } from '~/models/schemas/requests/User.request';

const passwordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGE.VALIDATION.PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGE.VALIDATION.PASSWORD_MUST_BE_A_STRING
  },
  isStrongPassword: {
    options: { minLength: 6, minUppercase: 1, minLowercase: 1, minNumbers: 1, minSymbols: 1 },
    errorMessage: USER_MESSAGE.VALIDATION.PASSWORD_MUST_BE_STRONG
  }
};

const confirmPasswordSchema: ParamSchema = {
  notEmpty: {
    errorMessage: USER_MESSAGE.VALIDATION.CONFIRM_PASSWORD_IS_REQUIRED
  },
  isString: {
    errorMessage: USER_MESSAGE.VALIDATION.CONFIRM_PASSWORD_MUST_BE_A_STRING
  },
  isStrongPassword: {
    options: { minLength: 6, minUppercase: 1, minLowercase: 1, minNumbers: 1, minSymbols: 1 },
    errorMessage: USER_MESSAGE.VALIDATION.CONFIRM_PASSWORD_MUST_BE_STRONG
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(USER_MESSAGE.VALIDATION.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD);
      }
      return true;
    }
  }
};

const dateOfBirthSchema: ParamSchema = {
  isISO8601: {
    options: { strict: true, strictSeparator: true },
    errorMessage: USER_MESSAGE.VALIDATION.DATE_OF_BIRTH_MUST_BE_ISO8601
  }
};

const imageSchema: ParamSchema = {
  optional: true,
  isString: {
    errorMessage: USER_MESSAGE.VALIDATION.AVATAR_IMG_URL_MUST_BE_A_STRING
  },
  trim: true,
  isLength: {
    options: { max: 400 },
    errorMessage: USER_MESSAGE.VALIDATION.AVATAR_IMG_URL_MUST_BE_LESS_THAN_400_CHARACTERS
  }
};

const forgotPasswordTokenSchema: ParamSchema = {
  custom: {
    options: async (value: string, { req }) => {
      if (!value) {
        throw new ErrorWithStatus({
          message: USER_MESSAGE.TOKEN.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
          status: HTTP_STATUS.UNAUTHORIZED
        });
      }
      try {
        const decoded_forgot_password_token = await verifyToken({
          token: value,
          secretOrPublicKey: process.env.JWT_SECRET_KEY_FORGOT_PASSWORD_TOKEN as string
        });
        console.log(decoded_forgot_password_token);
        const { user_id } = decoded_forgot_password_token;
        const user = await databaseService.users.findOne({ _id: new ObjectId(user_id as string) });
        if (!user) {
          throw new ErrorWithStatus({
            message: USER_MESSAGE.TOKEN.FORGOT_PASSWORD_TOKEN_IS_INVALID,
            status: HTTP_STATUS.NOT_FOUND
          });
        }

        if (user.forgot_password_token !== value) {
          throw new ErrorWithStatus({
            message: USER_MESSAGE.TOKEN.FORGOT_PASSWORD_TOKEN_IS_INVALID,
            status: HTTP_STATUS.NOT_FOUND
          });
        }

        req.user = user;
      } catch (error) {
        throw new ErrorWithStatus({
          message: capitalize((error as JsonWebTokenError).message),
          status: HTTP_STATUS.UNAUTHORIZED
        });
      }
      return true;
    }
  }
};

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USER_MESSAGE.VALIDATION.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USER_MESSAGE.VALIDATION.EMAIL_IS_INVALID
        },
        custom: {
          options: async (value, { req }) => {
            const user = await usersService.checkEmailExist(value);
            if (!user) {
              throw new Error(USER_MESSAGE.AUTH.EMAIL_OR_PASSWORD_IS_INCORRECT);
            }
            const passwordHash = await hashPassword({ password: req.body.password, salt: user.salt });
            if (passwordHash.password !== user.password) {
              throw new Error(USER_MESSAGE.AUTH.EMAIL_OR_PASSWORD_IS_INCORRECT);
            }
            req.user = user;
            return true;
          }
        },
        trim: true
      },
      password: passwordSchema
    },
    ['body']
  )
);

export const nameSchema: ParamSchema = {
  notEmpty: { errorMessage: USER_MESSAGE.VALIDATION.NAME_IS_REQUIRED },
  isString: { errorMessage: USER_MESSAGE.VALIDATION.NAME_MUST_BE_A_STRING },
  isLength: {
    options: { min: 1, max: 100 },
    errorMessage: USER_MESSAGE.VALIDATION.NAME_LENGTH_MUST_BE_FROM_1_TO_100
  },
  trim: true
};

/**
 * -  Đây chỉ là nơi khai báo schema, không phải là nơi tiến hành validate
 * -  Để tiến hành validate thì cần phải run() nó ở middleware
 * -  Để lấy được kết quả validate thì cần phải sử dụng method validationResult() của express-validator
 * -  Hàm validate() bọc schema chính là một hàm return ra một middleware, và middleware này sẽ được sử dụng trong route
 */
export const registerValidator = validate(
  checkSchema(
    {
      name: nameSchema,
      email: {
        notEmpty: {
          errorMessage: USER_MESSAGE.VALIDATION.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USER_MESSAGE.VALIDATION.EMAIL_IS_INVALID
        },
        custom: {
          options: async (value) => {
            const isEmailExist = await usersService.checkEmailExist(value);
            if (isEmailExist) {
              throw new Error(USER_MESSAGE.VALIDATION.EMAIL_ALREADY_EXISTS);
            }
            return true;
          }
        },
        trim: true
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      date_of_birth: dateOfBirthSchema
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
                message: USER_MESSAGE.TOKEN.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              });
            }
            value = value.split(' ')[1];
            try {
              const decoded_authorization = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRET_KEY_ACCESS_TOKEN as string
              });
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
                message: USER_MESSAGE.TOKEN.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              });
              // Không gửi refresh token khi logout
            }

            try {
              const [decoded_refresh_token, refreshToken] = await Promise.all([
                verifyToken({ token: value, secretOrPublicKey: process.env.JWT_SECRET_KEY_REFRESH_TOKEN as string }),
                databaseService.refresh_tokens.findOne({ refresh_token: value })
              ]);

              // không cần thiết check decoded refresh token vì nó đã xử lý ở catch rồi

              if (!refreshToken)
                throw new ErrorWithStatus({
                  message: USER_MESSAGE.TOKEN.REFRESH_TOKEN_OR_NOT_EXIST,
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

export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: USER_MESSAGE.VALIDATION.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.NOT_FOUND
              });
            }

            try {
              const decoded_email_verify_token = await verifyToken({
                token: value,
                secretOrPublicKey: process.env.JWT_SECRET_KEY_EMAIL_VERIFY_TOKEN as string
              });

              (req as Request).decoded_email_verify_token = decoded_email_verify_token;
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
    ['body']
  )
);

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        notEmpty: {
          errorMessage: USER_MESSAGE.VALIDATION.EMAIL_IS_REQUIRED
        },
        isEmail: {
          errorMessage: USER_MESSAGE.VALIDATION.EMAIL_IS_INVALID
        },
        custom: {
          options: async (value, { req }) => {
            const user = await usersService.checkEmailExist(value);
            if (!user) {
              throw new Error(USER_MESSAGE.VALIDATION.EMAIL_IS_NOT_REGISTERED);
            }

            (req as Request).user = user;
            return true;
          }
        },
        trim: true
      }
    },
    ['body']
  )
);

export const verifyForgotPasswordValidator = validate(
  checkSchema(
    {
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
);

export const resetPasswordValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
);

export const verifyStatusAccount = (req: Request, res: Response, next: NextFunction) => {
  const { verify } = req.decoded_authorization as TokenPayload;
  if (verify !== UserVerifyStatus.Verified) {
    next(
      new ErrorWithStatus({
        message: USER_MESSAGE.VALIDATION.ACCOUNT_IS_NOT_VERIFIED,
        status: HTTP_STATUS.FORBIDDEN
      })
    );
    return;
  }
  next();
};

export const updateAccountValidator = validate(
  checkSchema({
    name: {
      ...nameSchema,
      optional: true,
      notEmpty: false
    },
    date_of_birth: { ...dateOfBirthSchema, optional: true, notEmpty: false },
    bio: {
      optional: true,
      isString: {
        errorMessage: USER_MESSAGE.VALIDATION.BIO_MUST_BE_A_STRING
      },
      trim: true,
      isLength: {
        options: { max: 200 },
        errorMessage: USER_MESSAGE.VALIDATION.BIO_MUST_BE_LESS_THAN_200_CHARACTERS
      }
    },
    location: {
      optional: true,
      isString: {
        errorMessage: USER_MESSAGE.VALIDATION.LOCATION_MUST_BE_A_STRING
      },
      trim: true,
      isLength: {
        options: { max: 100 },
        errorMessage: USER_MESSAGE.VALIDATION.LOCATION_MUST_BE_LESS_THAN_100_CHARACTERS
      }
    },
    website: {
      optional: true,
      isString: {
        errorMessage: USER_MESSAGE.VALIDATION.WEBSITE_MUST_BE_A_STRING
      },
      trim: true,
      isLength: {
        options: { max: 300 },
        errorMessage: USER_MESSAGE.VALIDATION.WEBSITE_MUST_BE_LESS_THAN_300_CHARACTERS
      }
    },
    username: {
      optional: true,
      isString: {
        errorMessage: USER_MESSAGE.VALIDATION.USERNAME_MUST_BE_A_STRING
      },
      trim: true,
      isLength: {
        options: { max: 50 },
        errorMessage: USER_MESSAGE.VALIDATION.USERNAME_MUST_BE_LESS_THAN_50_CHARACTERS
      }
    },
    avatar: imageSchema,
    cover_photo: imageSchema
  })
);
