import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/models/user.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {

  user: User | null = null;

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.userService.getProfile().subscribe({
      next: (data) => {
        this.user = data;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du profil :', err);
      }
    });
  }

  onEditProfile() {
  if (!this.user) return;

  const user = this.user;

  Swal.fire({
    title: 'Modifier mon profil',
    html: `
      <form style="max-width: 250px; margin: auto;">
        <div class="form-group">
          <input id="swal-nom" type="text" class="form-control" placeholder="Nom" value="${user.nom || ''}">
          <div id="error-nom" style="color:red; font-size:0.85em; margin-top:4px;"></div>
        </div>

        <div class="form-group">
          <input id="swal-prenom" type="text" class="form-control" placeholder="Prénom" value="${user.prenom || ''}">
          <div id="error-prenom" style="color:red; font-size:0.85em; margin-top:4px;"></div>
        </div>

        <div class="form-group">
          <div class="input-group mb-3">
            <div class="input-group-prepend">
              <span class="input-group-text"><i class="ni ni-mobile-button"></i></span>
            </div>
            <input id="swal-numero" type="text" class="form-control" placeholder="Numéro de téléphone" value="${user.numero || ''}">
          </div>
          <div id="error-numero" style="color:red; font-size:0.85em; margin-top:-16px;"></div>
        </div>
      </form>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Enregistrer',
    cancelButtonText: 'Annuler',
    preConfirm: () => {
      ['nom', 'prenom', 'numero'].forEach(field => {
        const el = document.getElementById(`error-${field}`);
        if (el) el.textContent = '';
      });

      const nom = (document.getElementById('swal-nom') as HTMLInputElement).value.trim();
      const prenom = (document.getElementById('swal-prenom') as HTMLInputElement).value.trim();
      const numeroStr = (document.getElementById('swal-numero') as HTMLInputElement).value.trim();
      const numero = Number(numeroStr);

      let hasError = false;

      if (!nom) {
        document.getElementById('error-nom')!.textContent = 'Le nom est requis.';
        hasError = true;
      }
      if (!prenom) {
        document.getElementById('error-prenom')!.textContent = 'Le prénom est requis.';
        hasError = true;
      }
      if (!numeroStr) {
        document.getElementById('error-numero')!.textContent = 'Le numéro est requis.';
        hasError = true;
      } else if (isNaN(numero) || numeroStr.length !== 8) {
        document.getElementById('error-numero')!.textContent = 'Le numéro doit contenir exactement 8 chiffres.';
        hasError = true;
      }

      if (hasError) return false;

      return { nom, prenom, numero };
    }
  }).then(result => {
    if (result.isConfirmed && result.value) {
      this.userService.updateMyProfile(result.value).subscribe({
        next: () => {
          Swal.fire('Succès', 'Profil mis à jour avec succès.', 'success');
          this.refreshProfile();
        },
        error: err => {
          Swal.fire('Erreur', 'Erreur lors de la mise à jour du profil.', 'error');
          console.error('Erreur update profil :', err);
        }
      });
    }
  });
}

refreshProfile() {
  this.userService.getProfile().subscribe({
    next: (data) => this.user = data,
    error: (err) => console.error('Erreur lors du rechargement du profil :', err)
  });
}

}
