import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { MfaChallengeDto } from './dto/mfa-challenge.dto';
import {
  MfaResetDto,
  MfaRotationConfirmDto,
  MfaSecurityActionDto,
} from './dto/mfa-management.dto';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './roles/roles.guard';
import { MfaManagementService } from './mfa-management.service';
import { JwtAuthGuard } from './jwt-auth/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

interface AuthenticatedUser {
  userId: string;
  sessionId: string;
  email: string;
  role: string | null;
  organizationId: string | null;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mfaManagement: MfaManagementService,
  ) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('mfa/challenge')
  completeMfaChallenge(@Body() challengeDto: MfaChallengeDto) {
    return this.authService.completeMfaChallenge(challengeDto);
  }

  @Post('mfa/rotation/confirm')
  confirmRotation(@Body() body: MfaRotationConfirmDto) {
    return this.mfaManagement.confirmRotation(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('security')
  security(@CurrentUser() user: AuthenticatedUser) {
    return this.mfaManagement.status(user.userId, user.organizationId!);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/recovery-codes/regenerate')
  regenerateRecoveryCodes(
    @Body() body: MfaSecurityActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.mfaManagement.regenerateCodes(
      user.userId,
      user.organizationId!,
      body,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/rotation/start')
  startRotation(
    @Body() body: MfaSecurityActionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.mfaManagement.startRotation(
      user.userId,
      user.organizationId!,
      body,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('OWNER')
  @Post('mfa/team/:userId/reset')
  resetManagerMfa(
    @Param('userId') targetUserId: string,
    @Body() body: MfaResetDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.mfaManagement.resetManager(
      user.userId,
      user.organizationId!,
      targetUserId,
      body.reason,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser) {
    return {
      userId: user.userId,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.revokeSession(user.userId, user.sessionId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  logoutAll(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.revokeAllSessions(user.userId);
  }
}
