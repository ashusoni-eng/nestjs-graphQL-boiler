import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

@InputType()
export class ResetPasswordInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @Length(4)
  otp: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(20)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{6,20}$/, {
    message:
      "Password must contain at least one letter, one number and one special character",
  })
  newPassword: string;
}
