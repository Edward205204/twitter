import express from 'express';
import databaseService from '~/services/databases.services';
import usersRouter from '~/routes/users.routes';

const app = express();
const PORT = 3000;
app.use(express.json());
app.use('/users', usersRouter);

databaseService.connect().catch(console.dir);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
