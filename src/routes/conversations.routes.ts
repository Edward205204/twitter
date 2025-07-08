import { Router } from 'express';
import { getConversationsController } from '~/controllers/conversations.controllers';

import { accessTokenValidator, verifyStatusAccount } from '~/middlewares/users.validators';
import { wrapRequestHandler } from '~/utils/handlers';

const conversationsRouter = Router();

conversationsRouter.get(
  '/receivers/:receiver_id',
  accessTokenValidator,
  verifyStatusAccount,
  wrapRequestHandler(getConversationsController)
);

export default conversationsRouter;
