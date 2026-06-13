import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class AdminAuthGuard extends JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const activated = (await super.canActivate(context)) as boolean;
    const request = context.switchToHttp().getRequest();

    if (request.user?.type !== 'admin') {
      throw new UnauthorizedException('Admin authentication required');
    }

    return activated;
  }
}
