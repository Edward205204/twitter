// file  nay la file con cua file databases.services.ts
// file nay dung de thao tac du lieu voi collection duoc khai bao o file databases.services.ts
import User from '~/models/schemas/User.schema';
import databaseService from './databases.services';
import { RegisterRequest } from '~/models/schemas/requests/User.request';
import { hashPassword } from '~/utils/crypto';
import UserSalt from '~/models/schemas/UserSalt.schema';

class users {
  async register(value: RegisterRequest) {
    const { password, salt } = await hashPassword(value.password);
    const result = await databaseService.users.insertOne(
      new User({
        ...value,
        date_of_birth: new Date(value.date_of_birth),
        password: password
      })
    );
    if (!result.acknowledged) {
      throw new Error('Failed to insert user into database');
    }
    const user_id = result.insertedId;
    await databaseService.user_salts.insertOne(new UserSalt({ user_id: user_id.toString(), salt }));
    return result;
  }

  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email });
    return Boolean(user);
  }
}

const usersService = new users();
export default usersService;
