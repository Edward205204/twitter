import { NextFunction, Request, Response } from 'express';
import { checkSchema } from 'express-validator';
import { USER_MESSAGE } from '~/constants/user_message';
import usersService from '~/services/users.services';
import { validate } from '~/utils/validate';

export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email or password is required' });
    return;
  }
  next();
};

/**
 * -  Đây chỉ là nơi khai báo schema, không phải là nơi tiến hành validate
 * -  Để tiến hành validate thì cần phải run() nó ở middleware
 * -  Để lấy được kết quả validate thì cần phải sử dụng method validationResult() của express-validator
 * -  Hàm validate() bọc schema chính là một hàm return ra một middleware, và middleware này sẽ được sử dụng trong route
 */
export const registerValidator = validate(
  checkSchema({
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
  })
);
