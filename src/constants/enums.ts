export enum UserVerifyStatus {
  Unverified = 0,
  Verified = 1,
  Banned = 2
}
//  Xác định giá trị để khi thay đổi thứ tự trong enum thì không bị ảnh hưởng đến giá trị trong db
// Vì các value này được lưu trong db nên cần xác định giá trị cụ thể(nếu chỉ xử lý logic trong code thì không cần thiết)

export enum MediaType {
  Image,
  Video,
  HLS
}

export enum MediaTypeQuery {
  Image = 'image',
  Video = 'video'
}

export enum VideoEncodeStatus {
  Pending,
  Processing,
  Success,
  Failed
}

export enum TweetType {
  Tweet,
  Retweet,
  Comment,
  QuoteTweet
}

export enum TweetAudience {
  Everyone, // 0
  TwitterCircle // 1
}

export enum PeopleFollow {
  Yes = '1',
  No = '0'
}
