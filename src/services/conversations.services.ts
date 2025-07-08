import databaseService from './databases.services';
import { ObjectId } from 'mongodb';

class ConversationsService {
  async getConversations({
    user_id,
    receiver_id,
    page,
    limit
  }: {
    user_id: string;
    receiver_id: string;
    page: number;
    limit: number;
  }) {
    const match = [
      {
        sender_id: new ObjectId(user_id),
        receiver_id: new ObjectId(receiver_id)
      },
      {
        sender_id: new ObjectId(receiver_id),
        receiver_id: new ObjectId(user_id)
      }
    ];
    const data = await databaseService.conversations
      .find({
        $or: match
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
    const total = await databaseService.conversations.countDocuments({
      $or: match
    });

    return {
      data,
      total
    };
  }
}

const conversationsService = new ConversationsService();

export default conversationsService;
