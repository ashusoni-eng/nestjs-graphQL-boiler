import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

@InputType()
export class ForgetPasswordInput {
  @Field({ nullable: true })
  @IsEmail()  
  email: string;

  @Field({ nullable: true })
  @IsString()
  @Matches(/^\d{10}$/, {
    message: 'Phone must be exactly 10 digits',
  })  
  phone: string;
}
