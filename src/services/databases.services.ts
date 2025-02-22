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
    this.db = this.client.db(process.env.DB_NAME);
    console.log(this.client);
  }
  // hàm connect() sẽ kiểm tra kết nối tới MongoDB
  async connect() {
    try {
      await this.db.command({ ping: 1 });
      console.log('Pinged your deployment. You successfully connected to MongoDB!');
    } finally {
      await this.client.close();
    }
  }

  get users(): Collection<User> {
    return this.db.collection(process.env.DB_USER_COLLECTION as string);
  }
}

const databaseService = new Databases();
export default databaseService;

// run().catch(console.dir);
