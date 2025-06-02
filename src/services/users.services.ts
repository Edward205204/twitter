import User from '~/models/schemas/User.schema';
import databaseService from './databases.services';
import { RegisterRequest, UpdateAccountReqBody } from '~/models/schemas/requests/User.request';
import dotenv from 'dotenv';
import { hashPassword } from '~/utils/crypto';
import { signToken, verifyToken } from '~/utils/jwt';
import { TokenType } from '~/constants/token_type';
import { ObjectId } from 'mongodb';
import RefreshToken from '~/models/schemas/RefreshToken.schema';
import { USER_MESSAGE } from '~/constants/user.message';
import { UserVerifyStatus } from '~/constants/enums';
import omitBy from 'lodash/omitBy';
import isUndefined from 'lodash/isUndefined';
import { MatchKeysAndValues } from 'mongodb';
import { ErrorWithStatus } from '~/models/Errors';
import { HTTP_STATUS } from '~/constants/http_request';
import Follow from '~/models/schemas/Follow.schema';
import axios from 'axios';
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

  decodeRefreshToken(refresh_token: string) {
    return verifyToken({
      token: refresh_token,
      secretOrPublicKey: process.env.JWT_SECRET_KEY_REFRESH_TOKEN as string
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
  private async refreshToken({
    user_id,
    verify,
    exp
  }: {
    user_id: string;
    verify: UserVerifyStatus;
    exp?: number;
  }): Promise<string> {
    // Nếu exp không được truyền vào thì sẽ dùng thời gian mặc định là REFRESH_TOKEN_EXPIRATION_TIME, nếu có thì dùng exp được truyền vào(dùng cho việc refresh token)
    if (exp) {
      return await signToken({
        secretOrPrivateKey: process.env.JWT_SECRET_KEY_REFRESH_TOKEN as string,
        payload: { user_id, token_type: TokenType.RefreshToken, verify, exp }
      });
    }
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

    console.log('email_verify_token', email_verify_token);

    const result = await databaseService.users.insertOne(
      new User({
        ...value,
        _id: user_id,
        date_of_birth: new Date(value.date_of_birth),
        password: password,
        email_verify_token,
        salt,
        username: `user${user_id.toString()}`
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
    const { exp, iat } = await this.decodeRefreshToken(refresh_token);
    await databaseService.refresh_tokens.insertOne(new RefreshToken({ user_id, refresh_token, exp, iat }));
    return { access_token, refresh_token };
  }

  async login({ user_id, verify }: { user_id: ObjectId; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.sightAccessTokenAndRefreshToken({
      user_id: user_id.toString(),
      verify
    });
    const { exp, iat } = await this.decodeRefreshToken(refresh_token);
    await databaseService.refresh_tokens.insertOne(new RefreshToken({ user_id, refresh_token, exp, iat }));
    return { access_token, refresh_token };
  }

  private async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code'
    };
    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return data as {
      access_token: string;
      id_token: string;
    };
  }

  private async getOauthGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: {
        access_token,
        alt: 'json'
      },
      headers: {
        Authorization: `Bearer ${id_token}`
      }
    });
    return data as {
      id: string;
      email: string;
      verified_email: boolean;
      name: string;
      given_name: string;
      family_name: string;
      picture: string;
      locale: string;
    };
  }

  async oauth(code: string) {
    const { access_token, id_token } = await this.getOauthGoogleToken(code);
    const userInfo = await this.getOauthGoogleUserInfo(access_token, id_token);
    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({
        message: USER_MESSAGE.AUTH.GOOGLE_EMAIL_NOT_VERIFIED,
        status: HTTP_STATUS.BAD_REQUEST
      });
    }

    const user = await this.checkEmailExist(userInfo.email);
    if (user) {
      // User đã tồn tại -> login
      const [access_token, refresh_token] = await this.sightAccessTokenAndRefreshToken({
        user_id: user._id.toString(),
        verify: UserVerifyStatus.Verified // đăng nhập bằng email nên set verify là Verified
      });
      // TODO: lưu refresh token vào database
      const { exp, iat } = await this.decodeRefreshToken(refresh_token);
      await databaseService.refresh_tokens.insertOne(new RefreshToken({ user_id: user._id, refresh_token, exp, iat }));
      return { access_token, refresh_token, is_new_user: false };
    } else {
      // User chưa tồn tại -> register
      const password = Math.random().toString(36).substring(2, 15);
      const newUser = await this.register({
        email: userInfo.email,
        password,
        date_of_birth: new Date().toISOString(),
        name: userInfo.name
      });

      return {
        access_token: newUser.access_token,
        refresh_token: newUser.refresh_token,
        is_new_user: true
      };
    }
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

  async refreshTokenHandling({
    refresh_token,
    user_id,
    verify,
    exp
  }: {
    refresh_token: string;
    user_id: string;
    verify: UserVerifyStatus;
    exp: number;
  }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.accessToken({ user_id, verify }),
      this.refreshToken({ user_id, verify, exp }),
      databaseService.refresh_tokens.deleteOne({ refresh_token })
    ]);

    const decoded_refresh_token = await this.decodeRefreshToken(new_refresh_token);

    await databaseService.refresh_tokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        refresh_token: new_refresh_token,
        exp: decoded_refresh_token.exp,
        iat: decoded_refresh_token.iat
      })
    );

    return { access_token: new_access_token, refresh_token: new_refresh_token };
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
    const { exp, iat } = await this.decodeRefreshToken(refresh_token);
    await databaseService.refresh_tokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), refresh_token, exp, iat })
    );

    return { access_token, refresh_token };
  }

  async resendVerifyEmail(user_id: string) {
    // Khi gửi lại email verify tức là lúc này vẫn chưa verify email thành công
    const email_verify_token = await this.emailVerifyToken({ user_id, verify: UserVerifyStatus.Unverified });
    // TODO: gửi email_verify_token đến EMAIL người dùng, nhưng giờ chưa implement gửi email

    console.log('email_verify_token', email_verify_token);
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

  async getProfile(username: string) {
    const user = await databaseService.users.findOne(
      { username },
      {
        projection: {
          password: 0,
          salt: 0,
          created_at: 0,
          updated_at: 0,
          email_verify_token: 0,
          forgot_password_token: 0
        }
      }
    );
    if (!user) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.NOT_FOUND,
        message: USER_MESSAGE.ERROR.USER_NOT_FOUND
      });
    }
    return {
      message: USER_MESSAGE.AUTH.GET_PROFILE_SUCCESS,
      result: user
    };
  }

  async follow(user_id: string, followed_user_id: string) {
    const isFollowed = await databaseService.follows.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    });

    if (isFollowed) {
      return {
        message: USER_MESSAGE.AUTH.FOLLOWED_USER_ALREADY
      };
    }

    await databaseService.follows.insertOne(
      new Follow({ user_id: new ObjectId(user_id), followed_user_id: new ObjectId(followed_user_id) })
    );
    return { message: USER_MESSAGE.AUTH.FOLLOWED_USER_SUCCESS };
  }

  async unfollow(user_id: string, followed_user_id: string) {
    const isFollowed = await databaseService.follows.findOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    });

    if (!isFollowed) {
      return {
        message: USER_MESSAGE.AUTH.NOT_FOLLOWED_THIS_USER
      };
    }

    await databaseService.follows.deleteOne({
      user_id: new ObjectId(user_id),
      followed_user_id: new ObjectId(followed_user_id)
    });
    return {
      message: USER_MESSAGE.AUTH.UNFOLLOWED_USER_SUCCESS
    };
  }
  async checkUsernameExist(username: string) {
    // kiểm tra xem username có tồn tại trong database hay chưa
    const user = await databaseService.users.findOne({ username });
    return !!user;
  }

  async changePassword(user: User, password: string, current_password: string) {
    const isCorrectPassword = await hashPassword({ password: current_password, salt: user.salt });
    if (isCorrectPassword.password !== user.password) {
      throw new ErrorWithStatus({
        message: USER_MESSAGE.VALIDATION.PASSWORD_IS_INCORRECT,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY
      });
    }

    const updated_password = await hashPassword({ password });
    await databaseService.users.updateOne(
      { _id: new ObjectId(user._id) },
      { $set: { password: updated_password.password, salt: updated_password.salt }, $currentDate: { updated_at: true } }
    );
    return { message: USER_MESSAGE.AUTH.CHANGE_PASSWORD_SUCCESS };
  }
}

const usersService = new users();
export default usersService;
