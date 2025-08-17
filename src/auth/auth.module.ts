import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthResolver } from "./auth.resolver";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UserModule } from "../user/user.module";
import { EmailModule } from "../common/services/email.module";
import { MessageModule } from "../common/services/message.module";
import { JwtStrategy } from "./strategies/jwt.strategy";

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "secret",
      signOptions: { expiresIn: "1d" },
    }),
    EmailModule,
    MessageModule,
  ],
  providers: [AuthResolver, AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
