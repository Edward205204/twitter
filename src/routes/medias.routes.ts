import { Router } from 'express';
import {
  getVideoEncodesStatusController,
  uploadImageController,
  uploadVideoController,
  uploadVideoHLSController
} from '~/controllers/medias.controllers';
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
  accessTokenValidator,
  verifyStatusAccount,
  wrapRequestHandler(uploadVideoController)
);

mediasRouter.post(
  '/upload-video-hls',
  accessTokenValidator,
  verifyStatusAccount,
  wrapRequestHandler(uploadVideoHLSController)
);

mediasRouter.get('/video-encodes-status/:id', wrapRequestHandler(getVideoEncodesStatusController));

export default mediasRouter;
