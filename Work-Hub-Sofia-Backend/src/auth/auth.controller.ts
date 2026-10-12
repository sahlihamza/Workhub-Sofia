// src/auth/auth.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; motDePasse: string }) {
    return this.authService.login(body.email, body.motDePasse);
  }

  @Post('refresh')
  async refresh(@Body() body: { refresh_token: string }) {
    return this.authService.refresh(body.refresh_token);
  }

  @Post('forgot-password')
async forgotPassword(@Body('email') email: string) {
  return await this.authService.sendResetPasswordEmail(email);
}

@Post('reset-password')

async resetPassword(@Body() body: { resetToken: string; motDePasse: string }) {
  await this.authService.resetPassword(body.resetToken, body.motDePasse);
  return { message: 'Mot de passe réinitialisé avec succès' };
}


}
