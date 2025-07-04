import { NextFunction, Request, Response } from 'express';
import path from 'path';
import { UPLOAD_IMAGES_DIR } from '~/constants/dir';
import { handleUploadImage, handleUploadVideo } from '~/utils/file';
import { getNameIgnoreExtension } from '~/utils/utils';
import fs from 'fs';
import sharp from 'sharp';
import { isDevelopment } from '~/utils/config';
import { config } from 'dotenv';
import { MediaType, VideoEncodeStatus } from '~/constants/enums';
import { Media } from '~/models/schemas/Other';
import { encodeHLSWithMultipleVideoStreams } from '~/utils/video';
import databaseService from './databases.services';
import VideoEncode from '~/models/schemas/VideoEncodes.schema';

config();

class Queue {
  private items: string[];
  private isEncoding: boolean;

  constructor() {
    this.items = [];
    this.isEncoding = false;
  }

  async enqueue(videoPath: string) {
    this.items.push(videoPath);
    const video_id = getNameIgnoreExtension(videoPath.split('/').pop() as string);
    await databaseService.video_encodes.insertOne(new VideoEncode({ video_id, status: VideoEncodeStatus.Pending }));
    this.processEncode();
  }

  async processEncode() {
    if (this.isEncoding) return;
    this.isEncoding = true;
    if (this.items.length > 0) {
      const videoItem = this.items[0];
      const video_id = getNameIgnoreExtension(videoItem.split('/').pop() as string);
      try {
        await databaseService.video_encodes.updateOne(
          { video_id },
          {
            $set: { status: VideoEncodeStatus.Processing },
            $currentDate: {
              updated_at: true
            }
          }
        );
        await encodeHLSWithMultipleVideoStreams(videoItem);

        // Xóa file gốc sau khi encode
        fs.unlink(videoItem, (err) => {
          if (err) {
            console.log('Delete original file error after encode HLS: ' + err.message);
          }
        });

        this.items.shift();
        console.log('Encode file ', videoItem, ' successfully');
        await databaseService.video_encodes.updateOne(
          { video_id },
          {
            $set: { status: VideoEncodeStatus.Success },
            $currentDate: {
              updated_at: true
            }
          }
        );
      } catch (error) {
        await databaseService.video_encodes
          .updateOne(
            { video_id },
            {
              $set: { status: VideoEncodeStatus.Failed, message: (error as Error)?.message },
              $currentDate: {
                updated_at: true
              }
            }
          )
          .catch((error) => {
            console.log('Update status failed: ' + error);
          });
        console.log('Encode file ', videoItem, ' error');
        console.log('Error: ' + error);
      }
      this.isEncoding = false;
      this.processEncode();
    }
  }
}

const queue = new Queue();

class MediasServices {
  async uploadImage(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
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
    console.log(`Processed in ${Date.now() - start}ms`);
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
        await queue.enqueue(file.filepath);

        const newFilename = getNameIgnoreExtension(file.newFilename);
        return {
          url: isDevelopment()
            ? `http://localhost:${process.env.PORT}/static/video-hls/${newFilename}/master.m3u8`
            : `${process.env.HOST}/static/video-hls/${newFilename}/master.m3u8`,
          type: MediaType.HLS
        };
      })
    );
    return data;
  }

  async getVideoEncodesStatus(id: string) {
    const data = await databaseService.video_encodes.findOne({ video_id: id });

    return data;
  }
}

const mediasServices = new MediasServices();

export default mediasServices;
