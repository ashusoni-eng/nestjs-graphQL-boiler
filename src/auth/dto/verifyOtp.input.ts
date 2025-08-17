import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, IsOptional, Matches } from "class-validator";

@InputType()
export class VerifyOtpInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsEmail({}, { message: "Invalid email address" })
  email?: string;

  @Field({ nullable: true })
  @IsOptional()
  @Matches(/^\d{10}$/, {
    message: "Phone must be exactly 10 digits",
  })
  phone?: string;

  @Field()
  @Matches(/^\d{4}$/, {
    message: "OTP must be exactly 4 digits",
  })
  otp: string;
}
