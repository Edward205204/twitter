import { Request, Response, NextFunction } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema';

export const validate = (validations: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validations.run(req); // run là method của express-validator, nhận req (cần check)
    const errors = validationResult(req); // validationResult là method của express-validator, nhận req (đã check) và trả về kết quả check là một mảng các lỗi (nếu có)
    if (errors.isEmpty()) return next();
    res.status(400).json({ errors: errors.mapped() });
  };
};
