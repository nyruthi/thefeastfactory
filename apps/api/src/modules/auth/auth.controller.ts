import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthRateLimitGuard } from '../../common/guards/auth-rate-limit.guard';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('customer/request-otp')
  @HttpCode(200)
  @UseGuards(AuthRateLimitGuard)
  requestCustomerOtp(@Body() dto: RequestOtpDto) {
    return this.auth.requestCustomerOtp(dto);
  }

  @Post('customer/verify-otp')
  @HttpCode(200)
  @UseGuards(AuthRateLimitGuard)
  verifyCustomerOtp(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyCustomerOtp(dto);
  }

  @Post('customer/refresh')
  @HttpCode(200)
  refreshCustomer(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken, 'customer');
  }

  @Post('customer/logout')
  @HttpCode(204)
  logoutCustomer() {
    return undefined;
  }

  @Post('admin/login')
  @HttpCode(200)
  @UseGuards(AuthRateLimitGuard)
  loginAdmin(@Body() dto: AdminLoginDto) {
    return this.auth.loginAdmin(dto);
  }

  @Post('admin/refresh')
  @HttpCode(200)
  refreshAdmin(@Body() dto: RefreshTokenDto) {
    return this.auth.refresh(dto.refreshToken, 'admin');
  }

  @Post('admin/logout')
  @HttpCode(204)
  logoutAdmin() {
    return undefined;
  }
}
