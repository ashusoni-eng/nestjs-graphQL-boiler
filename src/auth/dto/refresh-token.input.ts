import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class RefreshTokenInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
