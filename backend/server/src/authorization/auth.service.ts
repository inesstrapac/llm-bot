import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from 'src/service/user.service';
import { RegisterDto, User } from 'src/entities/user.entity';
import { LoginDto } from 'src/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwt: JwtService,
  ) {}

  async register(userRegisterData: RegisterDto) {
    const userExists = await this.userService.findByEmail(
      userRegisterData.email,
    );
    if (userExists) throw new ConflictException('Email already registered');

    const salt = Number(12);
    const passwordHash = await bcrypt.hash(userRegisterData.password, salt);
    userRegisterData.password = passwordHash;
    const newUser: Partial<User> = { ...userRegisterData, isActive: false };

    const user = await this.userService.create(newUser);
    return this.strip(user);
  }

  async login(userLoginData: LoginDto) {
    const user = await this.userService.findByEmail(userLoginData.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordsMatch = await bcrypt.compare(
      userLoginData.password,
      user.password,
    );
    if (!passwordsMatch) throw new UnauthorizedException('Invalid credentials');

    await this.userService.updateUser(user.id, { isActive: true });

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
    });
    return { accessToken, user: this.strip(user) };
  }

  async logout(userId: number) {
    const loggedOut = await this.userService.updateUser(userId, {
      isActive: false,
    });
    return loggedOut ? 'Successfully logged out' : 'Have not logged out';
  }

  private strip(user: any) {
    const { password, ...safe } = user;
    return safe;
  }
}
