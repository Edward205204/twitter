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
import { accessTokenDecode } from './constants/regex';
import { TokenPayload } from './models/schemas/requests/User.request';
import { UserVerifyStatus } from './constants/enums';

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

io.use(async (socket, next) => {
  try {
    const { Authorization } = socket.handshake.auth;

    if (!Authorization || !Authorization.startsWith('Bearer ')) {
      throw new Error('Invalid token');
    }

    const token = Authorization.split(' ')[1];

    const decoded_authorization = (await accessTokenDecode(token)) as TokenPayload;

    console.log(decoded_authorization.verify == UserVerifyStatus.Unverified);

    console.log(decoded_authorization.verify);
    console.log(UserVerifyStatus.Verified);
    if (decoded_authorization.verify !== UserVerifyStatus.Verified) {
      throw new Error('User is not verified');
    }

    (socket.handshake as any).decoded_authorization = decoded_authorization;
    socket.handshake.auth.access_token = token;
    next();
  } catch (error) {
    next({ message: 'Unauthorized', name: 'Unauthorized', data: error });
  }
});

io.on('connection', (socket) => {
  const { user_id } = (socket.handshake as any).decoded_authorization;

  users[user_id] = {
    socket_id: socket.id
  };

  socket.use(async (packet, next) => {
    const { access_token } = socket.handshake.auth;
    try {
      await accessTokenDecode(access_token);
      next();
    } catch (error) {
      next(new Error('Unauthorized'));
    }
  });

  socket.on('error', (error) => {
    if (error.message === 'Unauthorized') {
      socket.disconnect();
    }
  });

  socket.on('send_message', async (data) => {
    const socket_id_receiver = users[data.receiver_id]?.socket_id;
    if (!socket_id_receiver) return;

    const { receiver_id, content } = data;
    const conversation = new Conversation({
      sender_id: new ObjectId(user_id as string),
      receiver_id: new ObjectId(receiver_id as string),
      content
    });

    await databaseService.conversations.insertOne(conversation);
    socket.to(socket_id_receiver).emit('receive_message', {
      conversation
    });
  });
  socket.on('disconnect', () => {
    delete users[user_id];
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
