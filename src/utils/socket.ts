import { Server } from 'socket.io';
import { ObjectId } from 'mongodb';
import Conversation from '~/models/schemas/Conversation.schema';
import { accessTokenDecode } from '~/constants/regex';
import { TokenPayload } from '~/models/schemas/requests/User.request';
import { UserVerifyStatus } from '~/constants/enums';
import databaseService from '~/services/databases.services';

export const initSocket = (httpServer: any) => {
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
};
