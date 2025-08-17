import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Type } from '@nestjs/common';

@ObjectType()
export class PaginationInfo {
  @Field(() => Int)
  total: number;

  @Field(() => Int)
  perPage: number;

  @Field(() => Int)
  currentPage: number;

  @Field(() => Int)
  lastPage: number;
}


export function PaginatedResponse<TItem>(TItemClass: Type<TItem>) {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedResponseClass {
    @Field(() => [TItemClass])
    items: TItem[];

    @Field(() => PaginationInfo)
    pagination: PaginationInfo;
  }
  return PaginatedResponseClass;
}
