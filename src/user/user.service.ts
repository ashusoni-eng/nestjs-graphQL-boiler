import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateUserInput } from "./dto/create-user.input";
import { UpdateUserInput } from "./dto/update-user.input";
import {  getPaginationOptions } from "src/common/lib/pagination-helper";
import { handlePrismaError } from "src/common/lib/handlePrismaError";
import { ConfigService } from "@nestjs/config";
import { unlinkSync } from "fs";
import * as argon2 from "argon2";
import { SocialUser } from "src/common/types/common";
import { SocialLoginInput } from "src/auth/dto/social-login.input";
import { formatPaginatedResponse } from "src/common/pagination/pagination.utils";

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService, private readonly configService: ConfigService) {}

  async create(data: CreateUserInput) {
    const emailExists = await this.prisma.user.findUnique({
      select: {
        email: true,
      },
      where: { email: data.email },
    });

    if (emailExists) {
      throw new ConflictException("Email already exists");
    }

    const phoneExists = await this.prisma.user.findFirst({
      where: { phone: data.phone },
    });

    if (phoneExists) {
      throw new ConflictException("Phone already exists");
    }

    const hashedPassword = await this.generateHash(data.password);

    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

   async findAll(page: number, perPage: number) {
    try {
      const { skip, take } = getPaginationOptions({ page, perPage });

      const [items, total] = await this.prisma.$transaction([
        this.prisma.user.findMany({          
          skip,
          take,
        }),
        this.prisma.user.count(),
      ]);

      return formatPaginatedResponse(items, total, page, perPage);
    } catch (error) {
      handlePrismaError(error, "Fetching paginated User");
    }

    return this.prisma.user.findMany();
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },      
    });

    if (!user) {
      throw new NotFoundException(`User not found`);
    }

    const { password, ...safeUser } = user;

    return safeUser;
  }

    async findOneById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },      
    });

    if (!user) {
      throw new NotFoundException(`User not found`);
    }    

    return user;
  }

  async findByEmail(email: string) {
    email = email.toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }    

    return user;   
  }

  async findOtp(email: string) {
    email = email.toLowerCase();
    return this.prisma.otp.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });
  }

  findUserByEmailOrPhone(email?: string, phone?: string) {
    const whereClause: any = {};

    email = email?.toLowerCase();

    if (email) {
      whereClause.email = email;
    }

    if (phone) {
      whereClause.phone = phone;
    }

    return this.prisma.user.findFirst({
      where: whereClause,
    });
  }

  async update(id: string, updateUserInput: UpdateUserInput) {
    await this.findOne(id);

    if (updateUserInput.email) {
      const emailExists = await this.prisma.user.findFirst({
        where: {
          email: updateUserInput.email,
          NOT: { id },
        },
      });

      if (emailExists) {
        throw new ConflictException("Email already exists");
      }
    }

    if (updateUserInput.phone) {
      const phoneExists = await this.prisma.user.findFirst({
        where: {
          phone: updateUserInput.phone,
          NOT: { id },
        },
      });

      if (phoneExists) {
        throw new ConflictException("Phone already exists");
      }
    }

    const data: any = { ...updateUserInput };

    if (
      typeof updateUserInput.password === "string" &&
      updateUserInput.password.trim()
    ) {
      data.password = await this.generateHash(updateUserInput.password);
    } else {
      delete data.password;
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async updateEmailVerified(id: string, status: boolean) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { isVerified: status },
    });
  }

  async updateRefreshToken(userId: string, refreshToken: string | null) {
    const hashedRefreshToken = refreshToken
      ? await this.generateHash(refreshToken)
      : null;

    return this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User not found`);

    //profile pic
    if (user.image) {
      const baseUrl = this.configService.get<string>("APP_BASE_URL");
      const imagePath = user.image.replace(baseUrl + "/", "");
      try {
        unlinkSync(imagePath);
      } catch (err) {
        console.log(err);
      }
    }    
    // delete the user
    return this.prisma.user.delete({
      where: { id },
      select: { id: true },
    });
  }

  private async generateHash(password: string): Promise<string> {
    return argon2.hash(password);
  }

  async verifyPassword(
    hashedPassword: string,
    plainPassword: string
  ): Promise<boolean> {
    return argon2.verify(hashedPassword, plainPassword);
  }
 
  createSocialUser(socialUser: SocialLoginInput) {    
    return this.prisma.user.create({
      data: {        
        email: socialUser.email,
        phone: "0",
        name: socialUser.fullName,
        image: socialUser.profilePic,
        provider: socialUser.provider,
        providerId: socialUser.providerId,
        isVerified: true,                
      },
    });
  }
}

