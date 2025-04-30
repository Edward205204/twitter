// file  nay la file con cua file databases.services.ts
// file nay dung de thao tac du lieu voi collection duoc khai bao o file databases.services.ts
import User from '~/models/schemas/User.schema';
import databaseService from './databases.services';

class users {
  async register(value: User) {
    const { email, password, name, date_of_birth } = value;
    const result = await databaseService.users.insertOne(new User({ email, password, name, date_of_birth }));
    return result;
  }

  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email });
    return Boolean(user);
  }
}

const usersService = new users();
export default usersService;
