import { Router } from 'express';
import { serveStaticImageController, serveStaticVideoController } from '~/controllers/medias.controllers';

const staticRouter = Router();

staticRouter.use('/images/:name', serveStaticImageController);
staticRouter.use('/videos/:name', serveStaticVideoController);
export default staticRouter;
