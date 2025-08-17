import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class ChangePasswordResponse {
  @Field()
  message: string;
}
