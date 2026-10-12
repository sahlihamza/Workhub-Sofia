import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent {
  email: string = '';
  emailError: string = '';
  messageErreur: string = '';
  messageSuccess: string = '';

  constructor(private authService: AuthService) {}

  resetPassword() {
    this.emailError = '';
    this.messageErreur = '';
    this.messageSuccess = '';

    // Vérification locale
    if (!this.email) {
      this.emailError = 'L\'email est requis.';
      return;
    }

    // Appel backend
    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.messageSuccess = res.message;
        this.email = '';
      },
      error: (err) => {
        const msg = err.error?.message || 'Erreur lors de la réinitialisation.';
        if (msg.toLowerCase().includes('utilisateur introuvable')) {
          this.emailError = 'Aucun compte associé à cet email.';
        } else {
          this.messageErreur = msg;
        }
      }
    });
  }
}
