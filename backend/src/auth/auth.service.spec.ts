import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: Partial<Record<keyof UsersService, jest.Mock>>;
  let jwtService: Partial<Record<keyof JwtService, jest.Mock>>;

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({ id: '1', email: 'a@b.com', name: 'Test' });

      const result = await authService.register({ email: 'a@b.com', password: 'pass123', name: 'Test' });

      expect(result).toEqual({ id: '1', email: 'a@b.com', name: 'Test' });
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'a@b.com',
        password: expect.any(String),
        name: 'Test',
      });
      // Verify password was hashed (not plaintext)
      const savedPassword = usersService.create.mock.calls[0][0].password;
      expect(savedPassword).not.toBe('pass123');
      expect(await bcrypt.compare('pass123', savedPassword)).toBe(true);
    });

    it('should throw ConflictException if email exists', async () => {
      usersService.findByEmail.mockResolvedValue({ id: '1' });
      await expect(authService.register({ email: 'a@b.com', password: 'pass123', name: 'Test' }))
        .rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return token and user on valid credentials', async () => {
      const hashed = await bcrypt.hash('pass123', 10);
      usersService.findByEmail.mockResolvedValue({ id: '1', email: 'a@b.com', name: 'Test', password: hashed });

      const result = await authService.login({ email: 'a@b.com', password: 'pass123' });

      expect(result.token).toBe('mock-token');
      expect(result.user).toEqual({ id: '1', email: 'a@b.com', name: 'Test' });
      expect(jwtService.sign).toHaveBeenCalledWith({ sub: '1', email: 'a@b.com' });
    });

    it('should throw UnauthorizedException for wrong email', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(authService.login({ email: 'a@b.com', password: 'pass123' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      usersService.findByEmail.mockResolvedValue({ id: '1', email: 'a@b.com', password: hashed });
      await expect(authService.login({ email: 'a@b.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});
