import { Request } from 'express';
import { verifyToken } from '~/utils/jwt';

export const USER_NAME_REGEX = /^(?![0-9]+$)[A-Za-z0-9_]{4,15}$/;

export const accessTokenDecode = async (token: string, req?: Request) => {
  const decoded_authorization = await verifyToken({
    token: token,
    secretOrPublicKey: process.env.JWT_SECRET_KEY_ACCESS_TOKEN as string
  });

  if (req) {
    (req as Request).decoded_authorization = decoded_authorization;
    return true;
  }
  return decoded_authorization;
};
