import { Router } from 'express';
import { serveStaticImageController, serveStaticVideoController } from '~/controllers/medias.controllers';

const staticRouter = Router();

staticRouter.get('/images/:name', serveStaticImageController);
staticRouter.get('/video-stream/:name', (req, res, next) => {
  serveStaticVideoController(req, res, next);
});
export default staticRouter;
