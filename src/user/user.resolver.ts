import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { User } from "./entities/user.entity";
import { UserService } from "./user.service";
import { CreateUserInput } from "./dto/create-user.input";
import { UpdateUserInput } from "./dto/update-user.input";

@Resolver(() => User)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => [User])
  findAllUsers() {
    return this.userService.findAll();
  }

  @Mutation(() => User)
  registerUser(@Args("input") input: CreateUserInput) {
    return this.userService.create(input);
  }

  @Mutation(() => User)
  updateUser(@Args("id") id: string, @Args("input") input: UpdateUserInput) {
    return this.userService.update(id, input);
  }

  @Mutation(() => User)
  deleteUser(@Args("id") id: string) {
    return this.userService.remove(id);
  }
}
