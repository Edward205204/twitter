import { Router } from 'express';
import { uploadImageController } from '~/controllers/medias.controllers';
import { accessTokenValidator, verifyStatusAccount } from '~/middlewares/users.validators';
import { wrapRequestHandler } from '~/utils/handlers';

const mediasRouter = Router();

mediasRouter.post(
  '/upload-image',
  accessTokenValidator,
  verifyStatusAccount,
  wrapRequestHandler(uploadImageController)
);

export default mediasRouter;
