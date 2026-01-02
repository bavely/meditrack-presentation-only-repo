import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let mockUsers: {
    findByEmail: jest.Mock;
    setRefreshToken: jest.Mock;
    getRefreshToken: jest.Mock;
  };

  beforeEach(async () => {
    process.env.JWT_ACCESS_SECRET = 'access-secret';
    process.env.JWT_REFRESH_SECRET = 'refresh-secret';

    mockUsers = {
      findByEmail: jest.fn(),
      setRefreshToken: jest.fn(),
      getRefreshToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtService,
        { provide: UserService, useValue: mockUsers },
        { provide: PrismaService, useValue: {} },
        { provide: ConfigService, useValue: { get: () => undefined } },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should not return password on login', async () => {
    const password = 'secret';
    const hashed = await bcrypt.hash(password, 10);
    const user = {
      id: '1',
      email: 'test@example.com',
      password: hashed,
      role: 'USER',
      aud: 'mobile',
      prefersPush: true,
      prefersSms: false,
      timezone: 'UTC',
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: false,
      phoneVerified: false,
      gender: 'M',
      dob: new Date('1990-01-01'),
    } as any;

    mockUsers.findByEmail.mockResolvedValue(user);
    mockUsers.setRefreshToken.mockResolvedValue(undefined);

    const result = await service.login(user.email, password);

    expect(result.user).toBeDefined();
    expect(result.user).not.toHaveProperty('password');
  });

  it('should create valid access token from refresh token', async () => {
    const password = 'secret';
    const hashed = await bcrypt.hash(password, 10);
    const user = {
      id: '1',
      email: 'test@example.com',
      password: hashed,
      role: 'USER',
      aud: 'mobile',
      prefersPush: true,
      prefersSms: false,
      timezone: 'UTC',
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: false,
      phoneVerified: false,
      gender: 'M',
      dob: new Date('1990-01-01'),
    } as any;

    mockUsers.findByEmail.mockResolvedValue(user);
    let storedRefresh = '';
    mockUsers.setRefreshToken.mockImplementation(async (_id: string, token: string) => {
      storedRefresh = token;
    });

    const loginRes = await service.login(user.email, password);
    mockUsers.getRefreshToken.mockResolvedValue(storedRefresh);

    const refreshRes = await service.refresh(user.id, loginRes.refreshToken);
    const decoded = jwtService.verify(refreshRes.accessToken, { secret: process.env.JWT_ACCESS_SECRET });

    expect(decoded.sub).toBe(user.id);
    expect(decoded.exp - decoded.iat).toBe(15 * 60);
  });
});
