import { Component, OnInit } from '@angular/core';
import { DemandeCongeService } from 'src/app/services/demande-conge.service';
import { UserService } from 'src/app/services/user.service';
import * as dayjs from 'dayjs';  // <-- ici l'import corrigé

@Component({
  selector: 'app-demande-conge',
  templateUrl: './demande-conge.component.html',
  styleUrls: ['./demande-conge.component.scss']
})
export class DemandeCongeComponent implements OnInit {

  dateDebut: string = '';
  dateFin: string = '';
  cause: string = '';
  type: string = '';

  demiJourDebut: boolean = false;
  demiJourFin: boolean = false;
  dureeCalculee: number | null = null; // durée affichée


  typesConge = ['conge', 'conge_maladie', 'compensation'];

  messageErreur: string = '';
  messageSuccess: string = '';
  formSubmittedSuccessfully: boolean = false;
  today: string = '';
  soldeConge: number = 0;
  soldeCongeMaladie: number = 0;
soldeCompensation: number = 0;


  constructor(private demandeService: DemandeCongeService, private userService: UserService) { }

  ngOnInit(): void {
    const now = new Date();
    this.today = now.toISOString().split('T')[0]; // yyyy-MM-dd
    this.userService.getProfile().subscribe({
    next: (user) => {
      this.soldeConge = user.soldeConge;
      this.soldeCongeMaladie = user.soldeCongeMaladie;
      this.soldeCompensation = user.soldeCompensation;
    },
    error: (err) => {
      console.error('Erreur lors du chargement du profil:', err);
    }
  });
  }

  formatType(type: string): string {
    switch (type) {
      case 'conge': return 'Congé';
      case 'conge_maladie': return 'Congé maladie';
      case 'compensation': return 'Compensation';
      default: return type;
    }
  }
  

  createDemande(): void {
    this.messageErreur = '';
    this.messageSuccess = '';
    this.formSubmittedSuccessfully = false;

    if (!this.dateDebut || !this.dateFin || !this.cause || !this.type) {
      this.messageErreur = 'Veuillez remplir tous les champs.';
      return;
    }

    const demande = {
      dateDebut: this.dateDebut,
      dateFin: this.dateFin,
      cause: this.cause,
      type: this.type,
      demiJourDebut: this.demiJourDebut,
      demiJourFin: this.demiJourFin,
    };

    this.demandeService.createDemande(demande).subscribe({
      next: (res) => {
        this.messageSuccess = res.message;
        this.formSubmittedSuccessfully = true;
        this.resetForm();
      },
      error: (err) => {
        this.messageErreur = err.error?.message || 'Une erreur est survenue.';
      }
    });
  }

  resetForm(): void {
    this.dateDebut = '';
    this.dateFin = '';
    this.cause = '';
    this.type = '';
    this.demiJourDebut = false;
    this.demiJourFin = false;
    this.dureeCalculee = null;
  }

  calculerDuree(): void {
    if (!this.dateDebut || !this.dateFin) {
      this.dureeCalculee = null;
      return;
    }
    const debut = dayjs(this.dateDebut);
    const fin = dayjs(this.dateFin);

    if (fin.isBefore(debut)) {
      this.dureeCalculee = null;
      return;
    }

    const diffJours = fin.diff(debut, 'day');

    if (diffJours === 0) {
      // même jour
      if (this.demiJourDebut && this.demiJourFin) {
        this.dureeCalculee = 0.5;
      } else {
        this.dureeCalculee = 1;
      }
    } else {
      let duree = diffJours + 1;
      if (this.demiJourDebut) duree -= 0.5;
      if (this.demiJourFin) duree -= 0.5;
      this.dureeCalculee = duree;
    }
  }
}
