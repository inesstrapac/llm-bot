import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, User } from 'src/entities/user.entity';
import { LoginDto } from 'src/entities/user.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() userRegisterData: RegisterDto): Promise<User> {
    return this.authService.register(userRegisterData);
  }

  @Post('login')
  login(@Body() userLoginData: LoginDto) {
    return this.authService.login(userLoginData);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  logout(@Req() req: any) {
    const userId = req.user.id;
    return this.authService.logout(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Req() req: any) {
    return req.user;
  }
}
