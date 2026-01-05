import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MinLength(3)
  usernameOrEmail: string;

  @IsString()
  @MinLength(6)
  password: string;
}
