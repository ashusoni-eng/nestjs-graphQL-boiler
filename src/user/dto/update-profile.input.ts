import { Field, InputType } from "@nestjs/graphql";
import { IsEmail, Matches } from "class-validator";

@InputType()
export class UpdateProfileInput {  
  @Field({ nullable: true })
  @Matches(/^[a-zA-Z\s]+$/, { message: "Name must contain only letters and spaces" })
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  @IsEmail({}, { message: "Invalid email address" })
  email?: string;

  @Field({ nullable: true })
  @Matches(/^\d{10}$/, {
    message: "Phone must be exactly 10 digits",
  })
  phone?: string;

  @Field({ nullable: true })
  password?: string;

  @Field({ nullable: true })  
  image?: string;

}
