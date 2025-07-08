import { Request, Response } from 'express';
import { CONVERSATIONS_MESSAGES } from '~/constants/conversations.message';
import conversationsService from '~/services/conversations.services';

export const getConversationsController = async (req: Request, res: Response) => {
  const receiver_id = req.params.receiver_id;
  const user_id = req.decoded_authorization?.user_id as string;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const { data, total } = await conversationsService.getConversations({ user_id, receiver_id, page, limit });
  res.json({
    message: CONVERSATIONS_MESSAGES.SUCCESS.GET_CONVERSATIONS_SUCCESS,
    data: {
      conversations: data,
      page,
      limit,
      total_page: Math.ceil(total / limit)
    }
  });
  return;
};
