
import { IsEmail, IsNotEmpty, MinLength, Validate, IsOptional } from 'class-validator';
import { Match } from '../../common/decorators/match.decorator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @Match('password')
  confirmPassword: string;

  @IsOptional()
  gymName?: string;
}
