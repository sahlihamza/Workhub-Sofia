import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service'; // adapte le chemin si besoin
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-new-password',
  templateUrl: './new-password.component.html',
  styleUrls: ['./new-password.component.scss']
})
export class NewPasswordComponent implements OnInit {
  newPassword: string = '';
  confirmPassword: string = '';
  
  newPasswordError: string = '';
  confirmPasswordError: string = '';
  
  messageErreur: string = '';
  messageSuccess: string = '';
  
  resetToken: string = '';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Récupérer le token dans l'URL (ex: /reset-password?token=xxx)
    this.route.queryParams.subscribe(params => {
      this.resetToken = params['token'] || '';
    });
  }

  submitNewPassword() {
    // Réinitialiser messages
    this.newPasswordError = '';
    this.confirmPasswordError = '';
    this.messageErreur = '';
    this.messageSuccess = '';

    // Validation simple côté front
    if (!this.newPassword) {
      this.newPasswordError = 'Le mot de passe est requis.';
      return;
    }

    if (this.newPassword.length < 8) {
      this.newPasswordError = 'Le mot de passe doit contenir au moins 8 caractères.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.confirmPasswordError = 'Les mots de passe ne correspondent pas.';
      return;
    }

    if (!this.resetToken) {
      this.messageErreur = 'Token de réinitialisation manquant.';
      return;
    }

    // Appeler le service backend pour réinitialiser le mot de passe
    this.authService.resetPassword(this.resetToken, this.newPassword).subscribe({
      next: (res) => {
        this.messageSuccess = res.message || 'Mot de passe réinitialisé avec succès.';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.messageErreur = err.error?.message || 'Une erreur est survenue.';
      }
    });
  }
}
