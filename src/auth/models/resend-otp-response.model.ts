import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class ResendOtpResponse {
  @Field()
  message: string;
  @Field({nullable: true})
  otp: string;
  @Field(()=>Date, {nullable: true})
  otpExpire: Date;
}
