import { Test, TestingModule } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let authService: {
    refresh: jest.Mock;
    logout: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      refresh: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthResolver,
        { provide: AuthService, useValue: authService },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
  });

  it('uses req.user.sub for refresh', async () => {
    authService.refresh.mockResolvedValue({ accessToken: 'new-access-token' });

    const response = await resolver.refresh('refresh-token', {
      user: { sub: 'user-123' },
    });

    expect(authService.refresh).toHaveBeenCalledWith('user-123', 'refresh-token');
    expect(response.data?.accessToken).toBe('new-access-token');
  });

  it('uses req.user.sub for logout', async () => {
    authService.logout.mockResolvedValue(undefined);

    const response = await resolver.logout({
      user: { sub: 'user-456' },
    });

    expect(authService.logout).toHaveBeenCalledWith('user-456');
    expect(response.data?.message).toBe('Logged out');
  });
});
