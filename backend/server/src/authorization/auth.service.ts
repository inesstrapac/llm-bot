import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { UserService } from 'src/service/user.service';
import {
  RegisterDto,
  User,
  LoginDto,
  UpdateUserDto,
} from 'src/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserService,
    private readonly jwt: JwtService,
  ) {}

  private signAccessToken(user: User) {
    const payload = {
      sub: String(user.id),
      email: user.email,
      role: user.role,
    };
    return this.jwt.signAsync(payload, {
      secret: 'superlongrandomsecret_change_me',
      issuer: 'math-bot',
      audience: 'web',
      expiresIn: '30m',
    });
  }

  private signRefreshToken(user: User) {
    const payload = { sub: String(user.id) };
    return this.jwt.signAsync(payload, {
      secret: 'superlongrandomsecret_change_me',
      issuer: 'math-bot',
      audience: 'web',
      expiresIn: '7d',
    });
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/auth',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    });
  }

  private strip(user: any) {
    const { password, ...safe } = user;
    return safe;
  }

  async register(data: RegisterDto) {
    const existing = await this.users.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await this.passwordHash(data.password);
    const newUser: Partial<User> = {
      ...data,
      password: hashedPassword,
      isActive: false,
    };

    const user = await this.users.create(newUser);
    return this.strip(user);
  }

  async passwordHash(password: string) {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    return passwordHash;
  }

  async login(dto: LoginDto, res: Response) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(dto.password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    await this.users
      .updateUser(user.id, { isActive: true })
      .catch(() => undefined);

    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.signRefreshToken(user);
    this.setRefreshCookie(res, refreshToken);

    const decoded: any = this.jwt.decode(accessToken);
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : null;
    res.setHeader('X-Access-Token', accessToken);
    if (expiresAt)
      res.setHeader('X-Access-Token-Expires-At', expiresAt.toISOString());

    return { user: this.strip({ ...user, isActive: true }) };
  }

  async checkPassword(userId: number, password: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password);
    return ok;
  }

  async refresh(req: any, res: Response) {
    const token = req.cookies?.refresh_token;
    if (!token) throw new UnauthorizedException('No refresh token');

    let payload: any;
    try {
      payload = await this.jwt.verifyAsync(token, {
        secret: 'superlongrandomsecret_change_me',
        issuer: 'math-bot',
        audience: 'web',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.users.findById(Number(payload.sub));
    if (!user) throw new UnauthorizedException('User not found');

    // (Optional) rotation: issue a brand-new refresh cookie
    const newRefresh = await this.signRefreshToken(user);
    this.setRefreshCookie(res, newRefresh);

    // new access token in headers
    const accessToken = await this.signAccessToken(user);
    const decoded: any = this.jwt.decode(accessToken);
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : null;
    res.setHeader('X-Access-Token', accessToken);
    if (expiresAt)
      res.setHeader('X-Access-Token-Expires-At', expiresAt.toISOString());

    return { user: this.strip(user) }; // return user if you like
  }

  async logout(userId: number, res: Response) {
    await this.updateUser(userId, { isActive: false }).catch(() => undefined);
    res.clearCookie('refresh_token', { path: '/auth' });
    return { message: 'Logged out' };
  }

  async updateUser(userId: number, data: UpdateUserDto) {
    if (data.password) {
      if (!data.oldPassword) {
        throw new BadRequestException('Old password is required');
      }
      const passwordsMatch = await this.checkPassword(userId, data.oldPassword);
      if (!passwordsMatch) {
        throw new BadRequestException('Passwords do not match');
      } else {
        const hashedNewPassword = await this.passwordHash(data.password);
        data = { password: hashedNewPassword };
      }
    }
    const updatedUser = await this.users.updateUser(userId, data);
    return updatedUser;
  }
}
