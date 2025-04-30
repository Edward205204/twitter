import { NextFunction, Request, Response } from 'express';
import { checkSchema } from 'express-validator';
import { validate } from '~/utils/validate';

export const loginValidator = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email or password is required' });
    return;
  }
  next();
};

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
      trim: true
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
