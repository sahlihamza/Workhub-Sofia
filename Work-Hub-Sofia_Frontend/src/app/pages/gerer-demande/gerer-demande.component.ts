import { Component, OnInit } from '@angular/core';
import { DemandeCongeService } from 'src/app/services/demande-conge.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-gerer-demande',
  templateUrl: './gerer-demande.component.html',
  styleUrls: ['./gerer-demande.component.scss']
})
export class GererDemandeComponent implements OnInit {

  demandes: any[] = [];
  demandesFiltrees: any[] = [];
  demandesAffichees: any[] = [];
  loading: boolean = false;
  filtreStatut: string = 'tous';

  // Pagination
  pageCourante: number = 1;
  taillePage: number = 5;
  totalPages: number = 0;

  constructor(private demandeCongeService: DemandeCongeService) { }

  ngOnInit(): void {
    this.getAllDemandes();
  }

  getAllDemandes(): void {
    this.loading = true;
    this.demandeCongeService.getAllDemandes().subscribe({
      next: (data) => {
        let demandesAvecUtilisateur = data.map(d => ({
          ...d,
          utilisateur: d.user
        }));

        // Trier : les "en attente" en premier
        this.demandes = demandesAvecUtilisateur.sort((a, b) => {
          if (a.statut === 'en_attente' && b.statut !== 'en_attente') return -1;
          if (a.statut !== 'en_attente' && b.statut === 'en_attente') return 1;
          return 0;
        });

        this.appliquerFiltre();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        
      }
    });
  }

  appliquerFiltre(): void {
    if (this.filtreStatut === 'tous') {
      this.demandesFiltrees = this.demandes;
    } else {
      this.demandesFiltrees = this.demandes.filter(d => d.statut === this.filtreStatut);
    }
    this.pageCourante = 1; // Revenir à la première page
    this.totalPages = Math.ceil(this.demandesFiltrees.length / this.taillePage);
    this.actualiserAffichage();
  }

  actualiserAffichage(): void {
    const startIndex = (this.pageCourante - 1) * this.taillePage;
    const endIndex = startIndex + this.taillePage;
    this.demandesAffichees = this.demandesFiltrees.slice(startIndex, endIndex);
  }

  changerPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.pageCourante = page;
      this.actualiserAffichage();
    }
  }

  traiterDemande(id: number, statut: 'confirmee' | 'rejettee'): void {
    Swal.fire({
      title: statut === 'confirmee' ? 'Confirmer cette demande ?' : 'Rejeter cette demande ?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.demandeCongeService.traiterDemande(id, statut).subscribe({
          next: (res) => {
            Swal.fire('Succès', res.message, 'success');
            this.getAllDemandes();
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Erreur', err.error?.message || 'Une erreur est survenue.', 'error');
          }
        });
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

  formatStatut(statut: string): string {
    switch (statut) {
      case 'en_attente': return 'En attente';
      case 'confirmee': return 'Confirmée';
      case 'rejettee': return 'Rejetée';
      default: return statut;
    }
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'en_attente': return 'statut-en-attente';
      case 'confirmee': return 'statut-confirmee';
      case 'rejettee': return 'statut-rejetee';
      default: return '';
    }
  }
}
