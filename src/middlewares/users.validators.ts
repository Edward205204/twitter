import { NextFunction, Request, Response } from 'express';
import { checkSchema } from 'express-validator';
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
      notEmpty: true,
      errorMessage: 'Name is required',
      isString: true,
      trim: true,
      isLength: {
        options: { min: 1, max: 100 },
        errorMessage: 'Name must be between 1 and 100 characters'
      }
    },
    email: {
      notEmpty: true,
      isEmail: true,
      errorMessage: 'Email is required',
      trim: true,
      custom: {
        options: async (value) => {
          const isEmailExist = await usersService.checkEmailExist(value);
          if (isEmailExist) {
            throw new Error('Email already exists');
          }
          return true;
        }
      }
    },
    password: {
      errorMessage: 'Password is required',
      notEmpty: true,
      isString: true,
      isStrongPassword: {
        options: { minLength: 6, minUppercase: 1, minLowercase: 1, minNumbers: 1, minSymbols: 1 },
        errorMessage: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      }
    },
    confirm_password: {
      errorMessage: 'Confirm password is required',
      notEmpty: true,
      isString: true,
      isStrongPassword: {
        options: { minLength: 6, minUppercase: 1, minLowercase: 1, minNumbers: 1, minSymbols: 1 },
        errorMessage: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      },
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error('Passwords do not match');
          }
          return true;
        }
      }
    },
    date_of_birth: {
      isISO8601: {
        options: { strict: true, strictSeparator: true }
      }
    }
  })
);
