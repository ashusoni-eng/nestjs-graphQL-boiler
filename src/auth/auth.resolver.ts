import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { AuthResponse } from './models/auth-response.model';
import { ForgetPasswordInput } from './dto/forgetPassword.input';
import { ResetPasswordInput } from './dto/resetPassword.input';
import { ResendOtpInput } from './dto/resend-otp.input';
import { RefreshTokenInput } from './dto/refresh-token.input';
import { VerifyOtpInput } from './dto/verifyOtp.input';
import { ChangePasswordInput } from './dto/changePassword.input';
import { SocialLoginInput } from './dto/social-login.input';
import { User } from '../user/entities/user.entity';
import { CurrentUser } from './decorator/current-user.decorator';
import { Public } from './decorator/public.decorator';
import { ForgetPasswordResponse } from './models/forget-password-response.model';
import { ResetPasswordResponse } from './models/reset-password-response.model';
import { ResendOtpResponse } from './models/resend-otp-response.model';
import { RefreshTokenResponse } from './models/refresh-token-response.model';
import { VerifyOtpResponse } from './models/verify-otp-response.model';
import { ChangePasswordResponse } from './models/change-password-response.model';
import { SocialLoginResponse } from './models/social-login-response.model';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Public()
  @Mutation(() => AuthResponse)
  register(@Args('input') input: RegisterInput) {
    return this.authService.register(input);
  }

  @Public()
  @Mutation(() => AuthResponse)
  login(@Args('input') input: LoginInput) {
    return this.authService.loginWithCredentials(input);
  }

  @Public()
  @Mutation(() => ForgetPasswordResponse)
  forgetPassword(@Args('input') input: ForgetPasswordInput) {
    return this.authService.sendResetOtp(input);
  }

  @Public()
  @Mutation(() => ResetPasswordResponse)
  resetPassword(@Args('input') input: ResetPasswordInput) {
    return this.authService.resetPassword(input);
  }

  @Public()
  @Mutation(() => ResendOtpResponse)
  resendOtp(@Args('input') input: ResendOtpInput) {
    return this.authService.resendOtp(input);
  }

  @Public()
  @Mutation(() => RefreshTokenResponse)
  refreshTokens(@Args('input') input: RefreshTokenInput) {
    return this.authService.refreshTokens(input);
  }

  @Public()
  @Mutation(() => VerifyOtpResponse)
  verifyOtp(@Args('input') input: VerifyOtpInput) {
    return this.authService.verifyOtp(input);
  }

  @Mutation(() => ChangePasswordResponse)
  changePassword(@Args('input') input: ChangePasswordInput, @CurrentUser() user: User) {
    return this.authService.changePassword(input, user.id);
  }

  @Public()
  @Mutation(() => SocialLoginResponse)
  socialLogin(@Args('input') input: SocialLoginInput) {
    return this.authService.socialLogin(input);
  }
}
