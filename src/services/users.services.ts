import { verify } from 'jsonwebtoken';
import User from '~/models/schemas/User.schema';
import databaseService from './databases.services';
import { RegisterRequest, UpdateAccountReqBody } from '~/models/schemas/requests/User.request';
import dotenv from 'dotenv';
import { hashPassword } from '~/utils/crypto';
import { signToken } from '~/utils/jwt';
import { TokenType } from '~/constants/token_type';
import { ObjectId } from 'mongodb';
import RefreshToken from '~/models/schemas/RefreshToken';
import { USER_MESSAGE } from '~/constants/user.message';
import { UserVerifyStatus } from '~/constants/enums';
import omitBy from 'lodash/omitBy';
import isUndefined from 'lodash/isUndefined';
import { MatchKeysAndValues } from 'mongodb';
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
  private async accessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }): Promise<string> {
    return await signToken({
      secretOrPrivateKey: process.env.JWT_SECRET_KEY_ACCESS_TOKEN as string,
      payload: { user_id, token_type: TokenType.AccessToken, verify },
      option: { expiresIn: process.env.ACCESS_TOKEN_EXPIRATION_TIME }
    });
  }

  private async emailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }): Promise<string> {
    return await signToken({
      secretOrPrivateKey: process.env.JWT_SECRET_KEY_EMAIL_VERIFY_TOKEN as string,
      payload: { user_id, token_type: TokenType.EmailVerificationToken, verify },
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
  private async refreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }): Promise<string> {
    return await signToken({
      secretOrPrivateKey: process.env.JWT_SECRET_KEY_REFRESH_TOKEN as string,
      payload: { user_id, token_type: TokenType.RefreshToken, verify },
      option: { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION_TIME }
    });
  }

  private async sightAccessTokenAndRefreshToken({
    user_id,
    verify
  }: {
    user_id: string;
    verify: UserVerifyStatus;
  }): Promise<string[]> {
    const [access_token, refresh_token] = await Promise.all([
      this.accessToken({ user_id, verify }),
      this.refreshToken({ user_id, verify })
    ]);
    return [access_token, refresh_token];
  }

  private async forgotPasswordToken({
    user_id,
    verify
  }: {
    user_id: string;
    verify: UserVerifyStatus;
  }): Promise<string> {
    return await signToken({
      secretOrPrivateKey: process.env.JWT_SECRET_KEY_FORGOT_PASSWORD_TOKEN as string,
      payload: { user_id, token_type: TokenType.ForgotPasswordToken, verify },
      option: { expiresIn: process.env.FORGOT_PASSWORD_TOKEN_EXPIRATION_TIME as string }
    });
  }

  async register(value: RegisterRequest) {
    const user_id = new ObjectId();
    const [{ password, salt }, email_verify_token] = await Promise.all([
      hashPassword({ password: value.password }),
      this.emailVerifyToken({ user_id: user_id.toString(), verify: UserVerifyStatus.Unverified })
      // Khi tạo user thì chưa verify email nên set verify là Unverified
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

    const [access_token, refresh_token] = await this.sightAccessTokenAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
      // Khi tạo user thì chưa verify email nên set verify là Unverified
    });

    return { access_token, refresh_token };
  }

  async login({ user_id, verify }: { user_id: ObjectId; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.sightAccessTokenAndRefreshToken({
      user_id: user_id.toString(),
      verify
    });
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

  /**
   * @param user_id
   * @returns Promise<string>
   * @description
   * - Hàm này dùng để verify email cho user
   * - Khi hàm này chạy có nghĩa là user đã tiến hành verify email rồi
   * @returns Promise<{ access_token: string; refresh_token: string }>
   */
  async verifyEmail(user_id: string) {
    // Khi thực hiện update_at thì có hai thời điểm
    // 1. Thời điểm tạo giá trị, 2. Thời điểm cập nhật giá trị
    // Dùng currentDate để cập nhật (thời điểm cập nhật giá trị)
    // Hoặc dùng "$$NOW" để cập nhật (thời điểm tạo giá trị)
    const [[access_token, refresh_token]] = await Promise.all([
      this.sightAccessTokenAndRefreshToken({ user_id: user_id.toString(), verify: UserVerifyStatus.Verified }),
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
    // Khi gửi lại email verify tức là lúc này vẫn chưa verify email thành công
    const email_verify_token = await this.emailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified });
    // TODO: gửi email_verify_token đến EMAIL người dùng, nhưng giờ chưa implement gửi email
    console.log(email_verify_token);
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      { $set: { email_verify_token }, $currentDate: { updated_at: true } }
    );
    return { email_verify_token };
  }

  async forgotPassword({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.forgotPasswordToken({ user_id, verify });
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      { $set: { forgot_password_token }, $currentDate: { updated_at: true } }
    );
    // TODO: Gửi email đến người dùng(chưa implement)
    console.log('forgot_password_token', forgot_password_token);
    return { message: USER_MESSAGE.AUTH.SENDED_FORGOT_PASSWORD_TO_USER_EMAIL };
  }

  async resetPassword(user_id: ObjectId, salt: string, password: string) {
    const updated_password = await hashPassword({ password, salt });
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: {
          password: updated_password.password,
          salt: updated_password.salt,
          forgot_password_token: ''
        },
        $currentDate: {
          updated_at: true
        }
      }
    );
    return { message: USER_MESSAGE.AUTH.RESET_PASSWORD_SUCCESS };
  }

  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      {
        projection: {
          password: 0,
          salt: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    );
    if (!user) {
      throw new Error(USER_MESSAGE.ERROR.USER_NOT_FOUND);
    }
    return {
      message: USER_MESSAGE.AUTH.GET_ME_SUCCESS,
      result: user
    };
  }

  async updateAccount(user_id: string, payload: UpdateAccountReqBody) {
    const updatePayload = {
      ...payload,
      ...(payload.date_of_birth && { date_of_birth: new Date(payload.date_of_birth) })
    };

    const cleanPayload = omitBy(updatePayload, isUndefined);
    const user = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: cleanPayload as MatchKeysAndValues<User>,
        $currentDate: {
          updated_at: true
        }
      },
      {
        returnDocument: 'after',
        projection: {
          password: 0,
          salt: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    );
    return {
      message: USER_MESSAGE.AUTH.UPDATE_ACCOUNT_SUCCESS,
      result: user
    };
  }
}

const usersService = new users();
export default usersService;
