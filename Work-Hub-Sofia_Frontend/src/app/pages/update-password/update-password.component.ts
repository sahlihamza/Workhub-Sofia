import { Component } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-update-password',
  templateUrl: './update-password.component.html',
  styleUrls: ['./update-password.component.scss']
})
export class UpdatePasswordComponent {

  ancienMotDePasse: string = '';
  nouveauMotDePasse: string = '';

  constructor(private userService: UserService) {}

 updatePassword(form: any) {
  if (this.ancienMotDePasse.length < 8 || this.nouveauMotDePasse.length < 8) {
    Swal.fire('Erreur', 'Les mots de passe doivent contenir au moins 8 caractères.', 'error');
    return;
  }

  this.userService.updatePassword(this.ancienMotDePasse, this.nouveauMotDePasse).subscribe({
    next: () => {
      Swal.fire('Succès', 'La modification est effectuée avec succès.', 'success');
      this.ancienMotDePasse = '';
      this.nouveauMotDePasse = '';
      form.resetForm();  // <-- reset complet du formulaire (champ + état)
    },
    error: (err) => {
      Swal.fire('Erreur', err.error?.message || 'Erreur lors de la modification', 'error').then(() => {
        window.location.reload();
      });
    }
  });
}

}
