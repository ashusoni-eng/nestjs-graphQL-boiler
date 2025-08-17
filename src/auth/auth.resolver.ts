import { Args, Mutation, Resolver, ObjectType, Field } from '@nestjs/graphql';
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

@ObjectType()
class ForgetPasswordResponse {
  @Field()
  message: string;

  @Field({ nullable: true })
  otp?: string;
}

@ObjectType()
class ResetPasswordResponse {
  @Field()
  message: string;
}

@ObjectType()
class ResendOtpResponse {
  @Field()
  message: string;
  @Field({nullable: true})
  otp: string;
  @Field(()=>Date, {nullable: true})
  otpExpire: Date;
}

@ObjectType()
class RefreshTokenResponse {
  @Field()
  accessToken: string;
  @Field()
  refreshToken: string;
}

@ObjectType()
class VerifyOtpResponse {
  @Field()
  message: string;
}

@ObjectType()
class ChangePasswordResponse {
  @Field()
  message: string;
}

@ObjectType()
class SocialLoginResponse extends AuthResponse {}

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
