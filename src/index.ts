import express from 'express';
import databaseService from '~/services/databases.services';
import usersRouter from '~/routes/users.routes';
import { defaultErrorHandler } from './middlewares/error.middlewares';

const app = express();
const PORT = 3000;
app.use(express.json());
app.use('/users', usersRouter);

/**
 * * @description
 * - Chốt chặn cuối cùng của error handler, đây là nơi xử lý các lỗi không được bắt ở các middleware khác
 * - Nếu không có chốt chặn này, server sẽ không trả về lỗi cho client mà sẽ bị crash
 */
app.use(defaultErrorHandler);

databaseService.connect().catch(console.dir);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
