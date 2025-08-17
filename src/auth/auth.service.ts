import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import { PrismaService } from "../prisma/prisma.service";
import { RegisterInput } from "./dto/register.input";
import { LoginInput } from "./dto/login.input";
import { UserService } from "src/user/user.service";
import { VerifyOtpInput } from "./dto/verifyOtp.input";
import { SocialUser, UserToken } from "src/common/types/common";
import { OAuth2Client } from 'google-auth-library';
import { User } from "@prisma/client";
import { ConfigService } from "@nestjs/config";
import { generateRegisterOtpEmailTemplate, generateResetPasswordOtpEmailTemplate } from "src/common/lib/email-sms-template";
import { EmailService } from "src/common/services/email.service";
import { ResendOtpInput } from "./dto/resend-otp.input";
import { RefreshTokenInput } from "./dto/refresh-token.input";
import { ForgetPasswordInput } from "./dto/forgetPassword.input";
import { MessageService } from "src/common/services/message.service";
import { generateCode } from "src/common/lib/generateCode";
import * as argon2 from "argon2";
import { ChangePasswordInput } from "./dto/changePassword.input";
import { SocialLoginInput } from "./dto/social-login.input";
import { ResetPasswordInput } from "./dto/resetPassword.input";

@Injectable()
export class AuthService {

    private oauthClient = new OAuth2Client({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: '',
  });


  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private userService: UserService,
    private readonly configService: ConfigService,
    private emailService: EmailService,
    private messageService: MessageService

  ) {}

   async getUserFromCode(code: string): Promise<SocialUser> {
    const { tokens } = await this.oauthClient.getToken(code);
    const { id_token } = tokens;

    if (!id_token) {
      throw new UnauthorizedException(
        'Google authentication failed: Missing tokens',
      );
    }
    const ticket = await this.oauthClient.verifyIdToken({
      idToken: id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.sub || !payload.email || !payload.name) {
      throw new UnauthorizedException(
        'Google authentication failed: Invalid ID token payload',
      );
    }

    return {
      email: payload.email,
      fullName: payload.name,
      profilePic: payload.picture,
      providerId: payload.sub,
      provider: 'google',
    };
  }
  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.isActive) {
      throw new ForbiddenException("Your account has been deactivated. Please contact support for assistance.");
    }

    if (!user.password) {
      throw new UnauthorizedException(
        "Password login not available for this account"
      );
    }

    const passwordIsValid = await this.userService.verifyPassword(
      user.password,
      password
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return user;
  }

  async login(user: User, otp?: string) {
    const tokens = await this.getTokens(user.id, user.email);
    await this.userService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      message: "Login successful",
      verified: user.isVerified,
      otp: otp,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,        
        isVerified: user.isVerified,        
      },
      ...tokens,
    };
  }

  async loginWithCredentials(
    loginDto: LoginInput,    
  ) {
    loginDto.email = loginDto.email.toLowerCase();

    const user = await this.validateUser(loginDto.email, loginDto.password);``    

    let otp: string | undefined;    

    if (!user.isVerified) {
      otp = await this.saveOtp(user.email, "");

      const html = generateRegisterOtpEmailTemplate(otp);
      await this.emailService.sendEmail(
        user.email,
        "Account Registration Verification Code",
        "",
        html
      );
    }

    return this.login(user, otp);
  }

  async resendOtp(resendOtpInput: ResendOtpInput) {
    const user = await this.userService.findByEmail(resendOtpInput.email);

    if (!user) {
      throw new NotFoundException("User not found");
    }
    const otp = await this.saveOtp(user.email, "");
    const otpRecord = await this.prisma.otp.findFirst({
      where: { email: user.email },
      orderBy: { createdAt: 'desc' },
    });

    const expiresAt = otpRecord ? otpRecord.expiresAt : null;

    const html = generateRegisterOtpEmailTemplate(otp);
    await this.emailService.sendEmail(
      user.email,
      "Verification Code",
      "",
      html
    );
    return {
      message: "OTP sent successfully to your email address",
      otp: otp,
      otpExpire: expiresAt,
    };
  }

  async register(registerDto: RegisterInput) {
    const user = await this.userService.create(registerDto);

    const otp = await this.saveOtp(user.email, "");
    const otpRecord = await this.prisma.otp.findFirst({
      where: { email: user.email },
      orderBy: { createdAt: 'desc' },
    });

    const expiresAt = otpRecord ? otpRecord.expiresAt : null;

    const html = generateRegisterOtpEmailTemplate(otp);
    await this.emailService.sendEmail(
      user.email,
      "Verify your account",
      "",
      html
    );

    const tokens = await this.getTokens(user.id, user.email);
    await this.userService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      message: "Registration successful. OTP sent to email.",
      otp: otp,
      otpExpire: expiresAt,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,        
        isVerified: user.isVerified,        
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenInput) {
    try {
      const { refreshToken } = refreshTokenDto;
      const payload = this.jwtService.verify<UserToken>(refreshToken, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      }) as User;

      const user = await this.userService.findByEmail(payload.email);

      if (!user || !user.refreshToken) {
        throw new ForbiddenException("Access denied");
      }

      const refreshTokenMatches = await this.userService.verifyPassword(
        user.refreshToken,
        refreshToken
      );

      if (!refreshTokenMatches) {
        throw new ForbiddenException("Access denied");
      }

      const tokens = await this.getTokens(
        user.id,
        user.email,
      );
      await this.userService.updateRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (error) {
      throw new ForbiddenException("Invalid refresh token");
    }
  }  

  private async getTokens(
    userId: string,
    email: string,
  ) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.configService.get<string>("JWT_SECRET"),
          expiresIn: this.configService.get<string>("JWT_EXPIRES_IN"),
        }
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
          expiresIn: this.configService.get<string>("JWT_REFRESH_EXPIRES_IN"),
        }
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async sendResetOtp(forgetPasswordDto: ForgetPasswordInput) {
    const user = await this.userService.findUserByEmailOrPhone(
      forgetPasswordDto.email,
      forgetPasswordDto.phone
    );
    const { email, phone } = forgetPasswordDto;

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const otp = await this.saveOtp(email, phone);

    if (email) {
      const html = generateResetPasswordOtpEmailTemplate(otp);
      await this.emailService.sendEmail(
        email,
        "Reset Password Verification Code",
        "",
        html
      );
    } else if (phone) {
      this.messageService.sendSMS(
        phone,
        `Your OTP is: ${otp}. Please do not share it with anyone. It will expire in 10 minutes.`
      );
    } else {
      throw new NotFoundException("Email or Phone not found");
    }

    return { message: "OTP sent to " + (email ? email : phone), otp };
  }

  async saveOtp(email: string, phone: string) {
    const otp = generateCode();

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const existingOtp = await this.prisma.otp.findFirst({
      where: {
        email,
        phone,
      },
    });

    if (existingOtp) {
      await this.prisma.otp.delete({
        where: {
          id: existingOtp.id,
        },
      });
    }

    await this.prisma.otp.create({
      data: {
        email,
        phone,
        otp,
        expiresAt,
      },
    });

    return otp;
  }

  async verifyOtp(verifyOtpInput: VerifyOtpInput) {
    const user = await this.userService.findUserByEmailOrPhone(
      verifyOtpInput.email,
      verifyOtpInput.phone
    );

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const otp = await this.prisma.otp.findFirst({
      where: {
        email: verifyOtpInput.email,
        phone: verifyOtpInput.phone,
        otp: verifyOtpInput.otp,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) {
      throw new BadRequestException("Invalid or Expired OTP");
    }

    if (!user.isVerified) {
      await this.userService.updateEmailVerified(user.id, true);
    }

    await this.prisma.otp.delete({
      where: {
        id: otp.id,
      },
    });

    return { message: "OTP verified successfully" };
  }

  async resetPassword(resetPasswordDto: ResetPasswordInput) {
    //verify otp
    const otp = await this.prisma.otp.findFirst({
      where: {
        email: resetPasswordDto.email,
        phone: resetPasswordDto.phone,
        otp: resetPasswordDto.otp,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) {
      throw new BadRequestException("Invalid or Expired OTP");
    }

    const user = await this.userService.findUserByEmailOrPhone(
      resetPasswordDto.email,
      resetPasswordDto.phone
    );

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (!user.password) {
      throw new UnauthorizedException(
        "Password login not available for this account"
      );
    }

    // Check if new password is same as old password
    const isSamePassword = await argon2.verify(
      user.password,
      resetPasswordDto.newPassword
    );

    if (isSamePassword) {
      throw new BadRequestException(
        "New password must be different from the current password"
      );
    }

    const hashedPassword = await argon2.hash(resetPasswordDto.newPassword);

    //update password
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
      },
    });

    //delete otp after verify
    await this.prisma.otp.delete({
      where: {
        id: otp.id,
      },
    });

    return { message: "Password reset successfully" };
  }

  async changePassword(changePasswordDto: ChangePasswordInput, id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (!user.password) {
      throw new BadRequestException(
        "Password login not available for this account"
      );
    }

    const valid = await this.userService.verifyPassword(
      user.password,
      changePasswordDto.currentPassword
    );

    if (!valid) {
      throw new BadRequestException("Current password is incorrect");
    }

    const isSamePassword = await argon2.verify(
      user.password,
      changePasswordDto.newPassword
    );

    if (isSamePassword) {
      throw new BadRequestException(
        "New password must be different from the current password"
      );
    }

    const hashedPassword = await argon2.hash(changePasswordDto.newPassword);

    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
      },
    });

    return { message: "Password Change Successfully." };
  }

  async socialLogin(socialUser: SocialLoginInput) {
    let user = await this.userService.findByEmail(socialUser.email);
    if (!user) {
      user = await this.userService.createSocialUser(socialUser);
    }

    const tokens = await this.getTokens(user.id, user.email);
    await this.userService.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      message: "Registration & Login successful",
      verified: user.isVerified,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,        
        isVerified: user.isVerified,                
      },
      ...tokens,
    };
  }
}
