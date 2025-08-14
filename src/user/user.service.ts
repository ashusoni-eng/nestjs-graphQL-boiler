import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";
import { CreateUserInput } from "./dto/create-user.input";
import { UpdateUserInput } from "./dto/update-user.input";

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany();
  }

  async create(data: CreateUserInput) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: data.email } });

    if (existingUser) {
      throw new NotFoundException(`User with email ${data.email} already found`);
    }
    
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: UpdateUserInput) {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return this.prisma.user.update({ where: { id }, data });
  }

   async remove(id: string) {
    const existingUser = await this.prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return this.prisma.user.delete({ where: { id }});
  }
}
