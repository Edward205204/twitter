import { Request, Response, NextFunction } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema';

export const validate = (validations: RunnableValidationChains<ValidationChain>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await validations.run(req); // run là method của express-validator, nhận req (cần check), tiến hành xác thực nhưng không trả về lỗi(nếu có) ngay lập tức
    const errors = validationResult(req); // validationResult là method của express-validator, nhận req (đã check) và lúc này nó sẽ trả về kết quả check là một mảng các lỗi (nếu có) đã check ở trên
    if (errors.isEmpty()) return next();
    res.status(400).json({ errors: errors.mapped() });
  };
};
