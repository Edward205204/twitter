import { Router } from 'express';
import { serveStaticImageController } from '~/controllers/medias.controllers';

const staticRouter = Router();

staticRouter.use('/:name', serveStaticImageController);

export default staticRouter;
