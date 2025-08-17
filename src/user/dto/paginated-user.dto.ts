import { ObjectType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { PaginatedResponse } from '../../common/pagination/pagination.dto';

@ObjectType()
export class PaginatedUsers extends PaginatedResponse(User) {}
