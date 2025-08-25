import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";
import { UserService } from "./user.service";
import { User } from "./entities/user.entity";
import { CreateUserInput } from "./dto/create-user.input";
import { UpdateUserInput } from "./dto/update-user.input";
import { Req, UseGuards } from "@nestjs/common";
import { GqlAuthGuard } from "../auth/guards/gql-auth.guard";
import { PaginatedUsers } from "./dto/paginated-user.dto";
import { join } from "path";
import { createWriteStream } from "fs";
import { FileUpload, GraphQLUpload } from "graphql-upload-ts";
import { CurrentUser } from "src/auth/decorator/current-user.decorator";
import { UpdateProfileInput } from "./dto/update-profile.input";
import { Roles } from "src/auth/decorator/roles.decorator";
import { RolesGuard } from "src/auth/guards/roles.guard";
import { Role } from "@prisma/client";

@UseGuards(GqlAuthGuard)
@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => User)
  createUser(@Args("createUserInput") createUserInput: CreateUserInput) {
    return this.userService.create(createUserInput);
  }

  @Query(() => PaginatedUsers, { name: "users" })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  findAll(@Args("page") page: string, @Args("perPage") perPage: string) {
    const pageNumber = parseInt(page, 10) || 1;
    const perPageNumber = parseInt(perPage, 10) || 10;
    return this.userService.findAll(pageNumber, perPageNumber);
  }

  @Query(() => User, { name: "user" })
  findOne(@Args("id", { type: () => String }) id: string) {
    return this.userService.findOne(id);
  }

  @Query(() => User, { name: "getProfile" })
  getProfile(@CurrentUser() user: User) {
    const id = user.id;
    return this.userService.findOne(id);
  }

  @Mutation(() => User)
  updateUser(@Args("updateUserInput") updateUserInput: UpdateUserInput) {
    return this.userService.update(updateUserInput.id, updateUserInput);
  }

  @Mutation(() => User)
  updateProfile(
    @Args("updateProfileInput") updateProfileInput: UpdateProfileInput,
    @CurrentUser() user: User
  ) {
    const userId = user.id;
    return this.userService.update(userId, updateProfileInput);
  }

  @Mutation(() => User)
  removeUser(@Args("id", { type: () => String }) id: string) {
    return this.userService.remove(id);
  }

  @Mutation(() => User)
  changeUserStatus(@Args("id", { type: () => String }) id: string) {
    return this.userService.changeStatus(id);
  }

  @Mutation(() => User)
  async uploadProfileImage(
    @Args({ name: "file", type: () => GraphQLUpload }) file: FileUpload,
    @CurrentUser() user: User
  ) {
    const userId = user.id;
    const { createReadStream, filename } = file;
    const uploadPath = join(process.cwd(), "public", "uploads", filename);

    await new Promise<void>((resolve, reject) => {
      createReadStream()
        .pipe(createWriteStream(uploadPath))
        .on("finish", () => resolve())
        .on("error", reject);
    });
    return this.userService.update(userId, {
      image: `/uploads/${filename}`,
    });
  }
}
