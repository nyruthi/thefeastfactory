import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../auth/jwt-payload';

export const CurrentAdmin = createParamDecorator((_: unknown, context: ExecutionContext): JwtPayload => {
  const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();
  return request.user;
});
