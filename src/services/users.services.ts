import User from '~/models/schemas/User.schema';
import databaseService from './databases.services';
import { RegisterRequest } from '~/models/schemas/requests/User.request';
import dotenv from 'dotenv';
import { hashPassword } from '~/utils/crypto';
import { signToken } from '~/utils/jwt';
import { TokenType } from '~/constants/token_type';
import { ObjectId } from 'mongodb';
import RefreshToken from '~/models/schemas/RefreshToken';
import { USER_MESSAGE } from '~/constants/user.message';
import { UserVerifyStatus } from '~/constants/enums';
dotenv.config();
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
      secretOrPrivateKey: process.env.JWT_SECRET_KEY_ACCESS_TOKEN as string,
      payload: { user_id, token_type: TokenType.AccessToken },
      option: { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_TIME }
    });
  }

  private async emailVerifyToken(user_id: string): Promise<string> {
    return await signToken({
      secretOrPrivateKey: process.env.JWT_SECRET_KEY_EMAIL_VERIFY_TOKEN as string,
      payload: { user_id, token_type: TokenType.EmailVerificationToken },
      option: { expiresIn: process.env.EMAIL_VERIFY_TOKEN_EXPIRATION_TIME as string }
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
      secretOrPrivateKey: process.env.JWT_SECRET_KEY_REFRESH_TOKEN as string,
      payload: { user_id, token_type: TokenType.RefreshToken },
      option: { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION_TIME }
    });
  }

  private async sightAccessTokenAndRefreshToken(user_id: string): Promise<string[]> {
    const [access_token, refresh_token] = await Promise.all([
      this.accessToken(user_id.toString()),
      this.refreshToken(user_id.toString())
    ]);
    return [access_token, refresh_token];
  }

  async register(value: RegisterRequest) {
    const user_id = new ObjectId();
    const [{ password, salt }, email_verify_token] = await Promise.all([
      hashPassword({ password: value.password }),
      this.emailVerifyToken(user_id.toString())
    ]);

    const result = await databaseService.users.insertOne(
      new User({
        ...value,
        _id: user_id,
        date_of_birth: new Date(value.date_of_birth),
        password: password,
        email_verify_token,
        salt
      })
    );

    if (!result.acknowledged) {
      throw new Error(USER_MESSAGE.ERROR.FAIL_TO_INSERT_USER);
    }

    const [access_token, refresh_token] = await this.sightAccessTokenAndRefreshToken(user_id.toString());

    return { access_token, refresh_token };
  }

  async login(user_id: ObjectId) {
    const [access_token, refresh_token] = await this.sightAccessTokenAndRefreshToken(user_id.toString());
    await databaseService.refresh_tokens.insertOne(new RefreshToken({ user_id, refresh_token }));
    return { access_token, refresh_token };
  }

  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email });
    return user;
  }

  async logout(refresh_token: string) {
    await databaseService.refresh_tokens.deleteOne({ refresh_token });
    // Khong cần thiết check result ở đây vì đã xử lý ở middleware rồi
    // if (!result.acknowledged) {
    //   throw new Error('Failed to delete refresh token from database');
    // }
    return { message: USER_MESSAGE.AUTH.LOGOUT_SUCCESS };
  }

  async verifyEmail(user_id: string) {
    // Khi thực hiện update_at thì có hai thời điểm
    // 1. Thời điểm tạo giá trị, 2. Thời điểm cập nhật giá trị
    // Dùng currentDate để cập nhật (thời điểm cập nhật giá trị)
    // Hoặc dùng "$$NOW" để cập nhật (thời điểm tạo giá trị)
    const [[access_token, refresh_token]] = await Promise.all([
      this.sightAccessTokenAndRefreshToken(user_id.toString()),
      databaseService.users.updateOne(
        { _id: new ObjectId(user_id) },
        {
          $set: {
            email_verify_token: '',
            verify: UserVerifyStatus.Verified
            // updated_at: new Date()
          },
          $currentDate: {
            updated_at: true
          }
        }
      )
    ]);
    await databaseService.refresh_tokens.insertOne(new RefreshToken({ user_id: new ObjectId(user_id), refresh_token }));

    return { access_token, refresh_token };
  }

  async resendVerifyEmail(user_id: string) {
    const email_verify_token = await this.emailVerifyToken(user_id);
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      { $set: { email_verify_token }, $currentDate: { updated_at: true } }
    );
    return { email_verify_token };
  }
}

const usersService = new users();
export default usersService;
