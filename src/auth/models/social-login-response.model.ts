import { ObjectType } from '@nestjs/graphql';
import { AuthResponse } from './auth-response.model';

@ObjectType()
export class SocialLoginResponse extends AuthResponse {}
