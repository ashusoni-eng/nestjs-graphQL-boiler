import { ObjectType, Field, ID, GraphQLISODateTime } from "@nestjs/graphql";

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  phone: string;

  @Field()
  email: string;  

  @Field({ nullable: true })
  image?: string;

  @Field({ nullable: true })
  isActive?: string;

  @Field({ nullable: true })
  role?: string;

  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  deletedAt?: Date | null;
}
