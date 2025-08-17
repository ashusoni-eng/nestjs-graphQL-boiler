import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class ForgetPasswordResponse {
  @Field()
  message: string;

  @Field({ nullable: true })
  otp?: string;
}
