import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { ConsoleOtpProvider } from './providers/console-otp.provider';
import { AuthRateLimitGuard } from '../../common/guards/auth-rate-limit.guard';

@Module({
  imports: [JwtModule.register({}), PassportModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ConsoleOtpProvider, AuthRateLimitGuard],
  exports: [AuthService],
})
export class AuthModule {}
