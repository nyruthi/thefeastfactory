export type JwtSubjectType = 'customer' | 'admin';

export type JwtPayload = {
  sub: string;
  type: JwtSubjectType;
  role?: 'ADMIN' | 'OPERATIONS';
  regionId?: string | null;
};
