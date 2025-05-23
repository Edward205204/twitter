// file nay dung de ket noi voi database, va thuc hien cac thao tac voi database
// khai bao tat ca cac collection o day
import { Collection, Db, MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import User from '~/models/schemas/User.schema';
import RefreshToken from '~/models/schemas/RefreshToken.schema';
import Follow from '~/models/schemas/Follow.schema';
dotenv.config();

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xbg5c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.xbg5c.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

class Databases {
  private client = new MongoClient(uri);
  private db: Db;
  constructor() {
    this.client = new MongoClient(uri);
    this.db = this.client.db(process.env.DB_NAME as string);
    this.connect();
  }
  async connect() {
    try {
      await this.client.connect();
      await this.db.command({ ping: 1 });
    } catch (error) {
      console.log('Error ', error);
      throw error;
    }
  }
  // các method get dùng để gọi các collection khác nhau trong cùng 1 database
  // mỗi collection sẽ có 1 schema riêng nhưng chỉ cần get 1 lần ở đây vì chung db

  /**
   * @description Lấy collection users từ database, có thể dùng với insertOne, find, update, delete
   * @returns {Collection<User>}  Trả về collection users
   */
  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USER_COLLECTION as string);
  }

  get refresh_tokens(): Collection<RefreshToken> {
    return this.db.collection(process.env.DB_REFRESH_TOKEN_COLLECTION as string);
  }

  get follows(): Collection<Follow> {
    return this.db.collection(process.env.DB_FOLLOW_COLLECTION as string);
  }
}

const databaseService = new Databases();
export default databaseService;

// run().catch(console.dir);
