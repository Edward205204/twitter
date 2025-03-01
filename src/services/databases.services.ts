// file nay dung de ket noi voi database, va thuc hien cac thao tac voi database
// khai bao tat ca cac collection o day
import { Collection, Db, MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import User from '~/models/schemas/User.schema';
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

  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USER_COLLECTION as string);
  }
}

const databaseService = new Databases();
export default databaseService;

// run().catch(console.dir);
