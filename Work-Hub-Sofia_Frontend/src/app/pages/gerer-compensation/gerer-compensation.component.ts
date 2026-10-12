import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';
import { User } from 'src/app/models/user.model';

@Component({
  selector: 'app-gerer-compensation',
  templateUrl: './gerer-compensation.component.html',
  styleUrls: ['./gerer-compensation.component.scss']
})
export class GererCompensationComponent implements OnInit {
  users: User[] = [];
  selectedUserId: number | null = null;
  daysToAdd: number | null = null;

  messageSuccess = '';
  messageErreur = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers() {
    // Appel backend pour récupérer les users du même département
    this.userService.AddCompensation().subscribe({
      next: (data: User[]) => {
        this.users = data;
      },
      error: (err) => {
        this.messageErreur = 'Erreur lors du chargement des utilisateurs';
        console.error(err);
      }
    });
  }

  ajouterCompensation() {
    if (!this.selectedUserId || this.daysToAdd === null) {
      this.messageErreur = 'Veuillez sélectionner un utilisateur et saisir le nombre de jours.';
      return;
    }

    this.userService.AddCompensation(this.selectedUserId, this.daysToAdd).subscribe({
      next: (res) => {
        this.messageSuccess = res.message;
        this.messageErreur = '';
        this.daysToAdd = null;
        this.selectedUserId = null;
        // Recharger la liste pour voir les nouveaux soldes
        this.loadUsers();
      },
      error: (err) => {
        this.messageErreur = err.error?.message || 'Erreur lors de l’ajout des jours';
        this.messageSuccess = '';
        console.error(err);
      }
    });
  }
}
