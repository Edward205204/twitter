import express from 'express';
import databaseService from '~/services/databases.services';
import usersRouter from '~/routes/users.routes';
import { defaultErrorHandler } from './middlewares/error.middlewares';
import mediasRouter from './routes/medias.routes';
import { initFolder } from './utils/file';
import { config } from 'dotenv';

import staticRouter from './routes/static.routes';
import { UPLOAD_VIDEOS_DIR } from './constants/dir';
import cors from 'cors';
import tweetsRouter from './routes/tweets.routes';
import bookmarksRouter from './routes/bookmarks.routes';
import likesRouter from './routes/likes.routes';
import searchRouter from './routes/search.routes';
import conversationsRouter from './routes/conversations.routes';

import { createServer } from 'http';
import { Server } from 'socket.io';
import { ObjectId } from 'mongodb';
import Conversation from './models/schemas/Conversation.schema';

// import './utils/fake';

config();

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 4000;

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:3000'
  }
});

const users: { [key: string]: { socket_id: string } } = {};

io.on('connection', (socket) => {
  const userId = socket.handshake.auth._id;
  users[userId] = {
    socket_id: socket.id
  };

  socket.on('send_message', async (data) => {
    const socket_id_receiver = users[data.receiver_id]?.socket_id;
    if (!socket_id_receiver) return;

    const { receiver_id, content } = data;
    const conversation = new Conversation({
      sender_id: new ObjectId(userId as string),
      receiver_id: new ObjectId(receiver_id as string),
      content
    });

    await databaseService.conversations.insertOne(conversation);
    socket.to(socket_id_receiver).emit('receive_message', {
      conversation
    });
  });
  socket.on('disconnect', () => {
    delete users[userId];
    console.log(`user ${socket.id} disconnected`);
  });
});

initFolder();
app.use(cors());
app.use(express.json());
app.use('/users', usersRouter);
app.use('/tweets', tweetsRouter);
app.use('/medias', mediasRouter);
app.use('/static', staticRouter);
app.use('/bookmarks', bookmarksRouter);
app.use('/likes', likesRouter);
app.use('/search', searchRouter);
app.use('/conversations', conversationsRouter);
app.use('/static/videos', express.static(UPLOAD_VIDEOS_DIR));

/**
 * * @description
 * - Chốt chặn cuối cùng của error handler, đây là nơi xử lý các lỗi không được bắt ở các middleware khác
 * - Nếu không có chốt chặn này, server sẽ không trả về lỗi cho client mà sẽ bị crash
 */
app.use(defaultErrorHandler);

databaseService
  .connect()
  .then(() => {
    databaseService.indexUsers();
    databaseService.indexRefreshTokens();
    databaseService.indexFollows();
    databaseService.indexVideoEncodes();
    databaseService.indexTweets();
  })
  .catch(console.dir);

httpServer.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
// Dùng socket.io để tạo realtime chat
