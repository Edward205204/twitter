import { JwtPayload, sign, verify } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { TokenPayload } from '~/models/schemas/requests/User.request';
dotenv.config();

export const signToken = ({
  payload,
  secretOrPrivateKey,
  option = { algorithm: 'HS256' }
}: {
  payload: string | Buffer | object;
  secretOrPrivateKey: string;
  option?: object;
}) => {
  return new Promise<string>((resolve, reject) =>
    sign(payload, secretOrPrivateKey, { ...option }, function (err, token) {
      if (err) {
        reject(err);
      }
      resolve(token as string);
    })
  );
};

export const verifyToken = ({ token, secretOrPublicKey }: { token: string; secretOrPublicKey: string }) => {
  return new Promise<TokenPayload>((resolve, reject) =>
    verify(token, secretOrPublicKey, (err, decoded) => {
      if (err) {
        reject(err);
      }
      resolve(decoded as TokenPayload);
    })
  );
};
