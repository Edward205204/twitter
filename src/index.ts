import express from 'express';
import databaseService from '~/services/databases.services';
import usersRouter from '~/routes/users.routes';

const app = express();
const PORT = 3000;
app.use(express.json());
app.use('/users', usersRouter);

/**
 * * @description
 * - Chốt chặn cuối cùng của error handler, đây là nơi xử lý các lỗi không được bắt ở các middleware khác
 * - Nếu không có chốt chặn này, server sẽ không trả về lỗi cho client mà sẽ bị crash
 */
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.status(404).json({ error: err.message });
});

databaseService.connect().catch(console.dir);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
