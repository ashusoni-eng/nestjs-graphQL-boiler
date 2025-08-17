import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class SocialLoginInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @Field()
  @IsEmail()
  email: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  profilePic?: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  provider: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  providerId: string;
}
