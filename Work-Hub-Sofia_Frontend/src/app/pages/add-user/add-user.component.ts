import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { DepartementService } from 'src/app/services/departement.service';
import { UserService } from 'src/app/services/user.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-user',
  templateUrl: './add-user.component.html',
  styleUrls: ['./add-user.component.scss']
})
export class AddUserComponent implements OnInit {
  @ViewChild('userForm') userForm!: NgForm;

  nom = '';
  prenom = '';
  email = '';
  numero = '';
  departementId: number = 0;
  role = '';
  departements: any[] = [];
  roles: string[] = [];
  showRoleSelect = true;
  disableDepartement = false;
  messageErreur: string[] = [];
  currentUserRole = '';
  disableRoleSelect = false;


  constructor(
    private userService: UserService,
    private departementService: DepartementService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDepartements();
    this.configureByRole();
  }

  loadDepartements() {
    this.departementService.getDepartments().subscribe({
      next: (departements) => {
        this.departements = departements;
      },
      error: (err) => {
        this.messageErreur = [err.error.message || 'Erreur lors du chargement des départements.'];
        console.error('Erreur getDepartements', err);
      }
    });
  }

  configureByRole() {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  const payload = JSON.parse(atob(token.split('.')[1]));
  this.currentUserRole = payload.role;
  const currentUserDepartementId = payload.departementId;

  if (this.currentUserRole === 'superadmin' || this.currentUserRole === 'admin') {
    this.roles = ['collaborateur'];
    this.departementId = currentUserDepartementId || 0;
    this.disableDepartement = this.currentUserRole !== 'superadmin';
    this.showRoleSelect = true;           
    this.role = 'collaborateur';           
    this.disableRoleSelect = true;         
  } else if (this.currentUserRole === 'manager') {
    this.roles = ['collaborateur'];
    this.role = 'collaborateur';
    this.departementId = currentUserDepartementId;
    this.disableDepartement = true;
    this.showRoleSelect = false;            
    this.disableRoleSelect = true;
  }
}



  createUser() {
    const finalRole = this.currentUserRole === 'manager' ? 'collaborateur' : this.role;

    const user = {
      nom: this.nom,
      prenom: this.prenom,
      email: this.email,
      numero: this.numero,
      departementId: Number(this.departementId),
      role: finalRole
    };

    this.userService.createUser(user).subscribe({
      next: () => {
        Swal.fire('Succès', 'Utilisateur ajouté avec succès.', 'success');
        this.userForm.resetForm();
        this.configureByRole();
        this.messageErreur = [];
         this.router.navigate(['/manager-users']);
      },
      error: (err) => {
        if (err.error && Array.isArray(err.error.message)) {
          this.messageErreur = err.error.message;
        } else if (typeof err.error.message === 'string') {
          this.messageErreur = [err.error.message];
        } else {
          this.messageErreur = ['Une erreur est survenue.'];
        }
        // Swal.fire('Erreur', 'Veuillez corriger les erreurs indiquées.', 'error');
      }
    });
  }

  // Méthode pour récupérer les messages d'erreur d'un champ spécifique
getMessagesForField(field: string): string[] {
  if (!this.messageErreur || this.messageErreur.length === 0) return [];
  const regex = new RegExp(`\\b${field.toLowerCase()}\\b`, 'i');

  return this.messageErreur.filter(msg => regex.test(msg.toLowerCase()));
}

}
