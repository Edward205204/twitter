import express from 'express';
import usersRouter from '~/routes/users.routes';
import databaseService from '~/services/databases.services';

const app = express();
const PORT = 3000;
app.use(express.json());
app.use('/users', usersRouter);

databaseService.connect().catch(console.dir);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
