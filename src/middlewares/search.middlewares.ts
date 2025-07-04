import { checkSchema } from 'express-validator';
import { MediaTypeQuery, PeopleFollow } from '~/constants/enums';
import { validate } from '~/utils/validate';

const searchValidator = validate(
  checkSchema(
    {
      content: {
        isString: true,
        isLength: {
          options: [{ min: 1, max: 512 }],
          errorMessage: 'Content must be between 1 and 512 characters'
        }
      },
      media_type: {
        optional: { options: { checkFalsy: true } },
        isIn: {
          options: [Object.values(MediaTypeQuery)],
          errorMessage: 'Media type is invalid (must be image or video)'
        }
      },
      people_follow: {
        optional: { options: { checkFalsy: true } },
        isIn: {
          options: [Object.values(PeopleFollow)],
          errorMessage: 'People follow is invalid (must be 1 or 0)'
        }
      }
    },
    ['query']
  )
);

export default searchValidator;
