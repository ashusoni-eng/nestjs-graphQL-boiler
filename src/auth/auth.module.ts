import { Module } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthResolver } from "./auth.resolver";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UserModule } from "../user/user.module";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || "your_jwt_secret",
      signOptions: { expiresIn: "1d" },
    }),
  ],
  providers: [AuthResolver, AuthService],
})
export class AuthModule {}
