import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { UPLOAD_IMAGES_DIR } from '~/constants/dir';
import { handleUploadImage, handleUploadVideo } from '~/utils/file';
import { getNameIgnoreExtension } from '~/utils/utils';
import fs from 'fs';
import sharp from 'sharp';
import { isDevelopment } from '~/utils/config';
import { config } from 'dotenv';
import { MediaType } from '~/constants/enums';
import { Media } from '~/models/schemas/Other';
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video';

config();

class Queue {
  private items: string[];
  private isEncoding: boolean;

  constructor() {
    this.items = [];
    this.isEncoding = false;
  }

  enqueue(videoPath: string) {
    this.items.push(videoPath);
    this.processEncode();
  }

  async processEncode() {
    if (this.isEncoding) return;
    this.isEncoding = true;
    if (this.items.length > 0) {
      const videoItem = this.items[0];
      try {
        await encodeHLSWithMultipleVideoStreams(videoItem);
      } catch (error) {
        console.log('Encode file ', videoItem, ' error');
        console.log('Error: ' + error);
      }
      // Xóa file gốc sau khi encode
      fs.unlink(videoItem, (err) => {
        if (err) {
          console.log('Delete original file error after encode HLS: ' + err.message);
        }
      });

      console.log('Encode file ', videoItem, ' successfully');
      this.items.shift();
      this.isEncoding = false;

      this.processEncode();
    }
  }
}

const queue = new Queue();

class MediasServices {
  async uploadImage(req: Request, res: Response, next: NextFunction) {
    const files = await handleUploadImage(req, res, next);
    const data: Media[] = await Promise.all(
      files.map(async (file) => {
        const newName = getNameIgnoreExtension(file.newFilename);
        const newPath = path.resolve(UPLOAD_IMAGES_DIR, `${newName}.jpg`);
        await sharp(file.filepath).jpeg().toFile(newPath);
        fs.unlinkSync(file.filepath);
        return {
          url: isDevelopment()
            ? `http://localhost:${process.env.PORT}/static/images/${newName}.jpg`
            : `${process.env.HOST}/static/images/${newName}.jpg`,
          type: MediaType.Image
        };
      })
    );
    return data;
  }

  async uploadVideo(req: Request, res: Response, next: NextFunction) {
    const files = await handleUploadVideo(req, res, next);
    const data: Media[] = await Promise.all(
      files.map(async (file) => {
        const { newFilename } = file;

        return {
          url: isDevelopment()
            ? `http://localhost:${process.env.PORT}/static/videos/${newFilename}`
            : `${process.env.HOST}/static/videos/${newFilename}`,
          type: MediaType.Video
        };
      })
    );
    return data;
  }

  async uploadVideoHLS(req: Request, res: Response, next: NextFunction) {
    const files = await handleUploadVideo(req, res, next);
    const data: Media[] = await Promise.all(
      files.map(async (file) => {
        queue.enqueue(file.filepath);
        // await encodeHLSWithMultipleVideoStreams(file.filepath);
        // fs.unlink(file.filepath, (err) => {
        //   if (err) {
        //     console.log('Delete original file error after encode HLS: ' + err.message);
        //   }
        // });
        const newFilename = getNameIgnoreExtension(file.newFilename);
        return {
          url: isDevelopment()
            ? `http://localhost:${process.env.PORT}/static/video-hls/${newFilename}`
            : `${process.env.HOST}/static/video-hls/${newFilename}`,
          type: MediaType.HLS
        };
      })
    );
    return data;
  }
}

const mediasServices = new MediasServices();

export default mediasServices;
