import { Module } from '@nestjs/common';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Module({
  providers: [UserResolver, UserService, RolesGuard],
  exports: [UserService]
})
export class UserModule {}
