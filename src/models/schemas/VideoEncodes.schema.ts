import { ObjectId } from 'mongodb';
import { VideoEncodeStatus } from '~/constants/enums';

interface VideoEncodeType {
  id?: ObjectId;
  video_id: string;
  status: VideoEncodeStatus;
  message?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
class VideoEncode {
  id?: ObjectId;
  video_id: string;
  status: VideoEncodeStatus;
  message?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor({ message, createdAt, status, updatedAt, video_id }: VideoEncodeType) {
    const date = new Date();
    this.id = new ObjectId();
    this.video_id = video_id;
    this.status = status;
    this.message = message || '';
    this.createdAt = createdAt || date;
    this.updatedAt = updatedAt || date;
  }
}

export default VideoEncode;
