import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';  // <-- importer Router

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
   emailError: string = '';
  passwordError: string = '';
  email: string = '';
  motDePasse: string = '';
  messageErreur: string = '';
  private sub?: Subscription;

  constructor(private userService: UserService,private router: Router) {}

  ngOnInit() {}

  login() {
    this.messageErreur = '';
     this.emailError = '';
    this.passwordError = '';

    // Validation simple front
    let hasError = false;

    if (!this.email.trim()) {
      this.emailError = "L'email est requis.";
      hasError = true;
    } else {
      // Optionnel : vérifier format email simple
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.email)) {
        this.emailError = "L'email n'est pas valide.";
        hasError = true;
      }
    }

    if (!this.motDePasse) {
      this.passwordError = "Le mot de passe est requis.";
      hasError = true;
    }

    if (hasError) {
      return; // stoppe l'exécution si erreurs front
    }
    this.sub = this.userService.login(this.email, this.motDePasse).subscribe({
      next: (res) => {
        console.log('Connexion réussie');

        // Stocker le token d'accès dans localStorage
      localStorage.setItem('access_token', res.access_token);

      // Eventuellement stocker aussi le refresh token si tu en as besoin
      localStorage.setItem('refresh_token', res.refresh_token);
        // ici tu peux faire une redirection ou stocker le token par exemple
        this.router.navigate(['/planning']);
      },
      error: (err) => {
        this.messageErreur = err.error.message || 'Une erreur est survenue.';
        console.error('Erreur de connexion', err);
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }
}
