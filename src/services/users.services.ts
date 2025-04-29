// file  nay la file con cua file databases.services.ts
// file nay dung de thao tac du lieu voi collection duoc khai bao o file databases.services.ts
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
