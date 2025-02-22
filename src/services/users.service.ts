import User from '~/models/schemas/User.schema';
import databaseService from './databases.services';

class users {
  register(value: { email: string; password: string }) {
    const { email, password } = value;
    const result = databaseService.users.insertOne(new User({ email, password }));
    return;
  }
}

const usersService = new users();
export default usersService;
