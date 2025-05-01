import User from '~/models/schemas/User.schema';
import databaseService from './databases.services';
import { RegisterRequest } from '~/models/schemas/requests/User.request';
import { hashPassword } from '~/utils/crypto';
import UserSalt from '~/models/schemas/UserSalt.schema';
import { signToken } from '~/utils/jwt';
import { TokenType } from '~/constants/token_type';

class users {
  /**
   * @param user_id
   * @returns Promise<string>
   * @description
   * - Generate access token for user
   * - Token will be signed with user_id and token_type
   * - Token will be expired in 15 minutes
   * - Token will be signed with RS256 algorithm
   * - Token will be signed with JWT_SECRET_KEY
   */
  private async accessToken(user_id: string): Promise<string> {
    return await signToken({
      payload: { user_id, token_type: TokenType.AccessToken },
      option: { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_TIME }
    });
  }

  /**
   * @param user_id
   * @returns Promise<string>
   * @description
   * - Generate refresh token for user
   * - Token will be signed with user_id and token_type
   * - Token will be expired in 1 year
   * - Token will be signed with RS256 algorithm
   * - Token will be signed with JWT_SECRET_KEY
   */
  private async refreshToken(user_id: string): Promise<string> {
    return await signToken({
      payload: { user_id, token_type: TokenType.RefreshToken },
      option: { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION_TIME }
    });
  }

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
    const [access_token, refresh_token] = await Promise.all([
      this.accessToken(user_id.toString()),
      this.refreshToken(user_id.toString())
    ]);

    await databaseService.user_salts.insertOne(new UserSalt({ user_id: user_id, salt }));

    return { access_token, refresh_token };
  }

  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email });
    return Boolean(user);
  }
}

const usersService = new users();
export default usersService;
