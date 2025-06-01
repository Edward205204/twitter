import { Router } from 'express';
import { uploadImageController, uploadVideoController } from '~/controllers/medias.controllers';
import { accessTokenValidator, verifyStatusAccount } from '~/middlewares/users.validators';
import { wrapRequestHandler } from '~/utils/handlers';

const mediasRouter = Router();

mediasRouter.post(
  '/upload-image',
  accessTokenValidator,
  verifyStatusAccount,
  wrapRequestHandler(uploadImageController)
);

//  tạm thời bỏ accessTokenValidator và verifyStatusAccount để test
mediasRouter.post(
  '/upload-video',
  // accessTokenValidator,
  // verifyStatusAccount,
  wrapRequestHandler(uploadVideoController)
);

export default mediasRouter;
