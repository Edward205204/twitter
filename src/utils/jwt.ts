import { sign } from 'jsonwebtoken';

export const signToken = ({
  payload,
  secretOrPrivateKey = process.env.JWT_SECRET_KEY as string,
  option = { algorithm: 'RS256' }
}: {
  payload: string | Buffer | object;
  secretOrPrivateKey?: string;
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
