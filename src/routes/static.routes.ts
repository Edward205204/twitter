import { Router } from 'express';
import {
  serveStatic_m3u8Controller,
  serveStaticImageController,
  serveStaticSegmentController,
  serveStaticVideoController
} from '~/controllers/medias.controllers';

const staticRouter = Router();

staticRouter.get('/images/:name', serveStaticImageController);
staticRouter.get('/video-stream/:name', (req, res, next) => {
  serveStaticVideoController(req, res, next);
});

staticRouter.get('/video-hls/:id/master.m3u8', serveStatic_m3u8Controller);
staticRouter.get('/video-hls/:id/:v/:segment', serveStaticSegmentController);
export default staticRouter;
