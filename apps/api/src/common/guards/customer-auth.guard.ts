import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class CustomerAuthGuard extends JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const activated = (await super.canActivate(context)) as boolean;
    const request = context.switchToHttp().getRequest();

    if (request.user?.type !== 'customer') {
      throw new UnauthorizedException('Customer authentication required');
    }

    return activated;
  }
}
