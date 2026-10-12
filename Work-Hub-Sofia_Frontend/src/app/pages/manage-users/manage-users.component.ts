import { Component, OnInit } from '@angular/core';
import { Departement } from 'src/app/models/departement.model';
import { User } from 'src/app/models/user.model';
import { DepartementService } from 'src/app/services/departement.service';
import { UserService } from 'src/app/services/user.service';
import Swal from 'sweetalert2'; // ⬅️ Ajout de l'import
import { Tooltip } from 'bootstrap';


@Component({
  selector: 'app-manage-users',
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss']
})
export class ManageUsersComponent implements OnInit {
  currentUserRole: string = '';
  users: User[] = [];
  departements: Departement[] = [];

  messageErreur: string = '';
  messageSuccess: string = '';

  // 📌 Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10; // 10 utilisateurs par page
  paginatedUsers: any[] = [];
totalPages: number = 1;

  constructor(private userService: UserService,  private departementService: DepartementService) { }

  ngOnInit() {
      this.loadCurrentUserRole(); // Charge le rôle de l'utilisateur actuel
      // Charge les utilisateurs et départements au démarrage
    this.loadUsers();
     this.loadDepartements();
     // Active les tooltips Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map((tooltipTriggerEl: any) => new Tooltip(tooltipTriggerEl));
  }
  //cette methode permet de charger le rôle de l'utilisateur actuel à partir du token JWT stocké dans localStorage
  // pour controller l'affichage des actions dans le tableau
  loadCurrentUserRole() {
  const token = localStorage.getItem('access_token');
  if (!token) {
    this.currentUserRole = '';
    return;
  }
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    this.currentUserRole = payload.role || '';
  } catch {
    this.currentUserRole = '';
  }
}

  loadDepartements() {
    this.departementService.getDepartments().subscribe({
      next: (departements) => {
        this.departements = departements;
      },
      error: (err) => {
        this.messageErreur = err.error.message || 'Erreur lors du chargement des départements.';
        console.error('Erreur getDepartements', err);
      }
    });
  }

  //pagination methods
  loadUsers() {
  // Appel API pour charger tous les utilisateurs
  this.userService.getUsers().subscribe({
    next: (data) => {
      this.users = data;
      this.totalPages = Math.ceil(this.users.length / this.itemsPerPage);
      this.updatePaginatedUsers();
    },
    error: (err) => {
      this.messageErreur = 'Erreur lors du chargement des utilisateurs';
    }
  });
}

updatePaginatedUsers() {
  const startIndex = (this.currentPage - 1) * this.itemsPerPage;
  const endIndex = startIndex + this.itemsPerPage;
  this.paginatedUsers = this.users.slice(startIndex, endIndex);
}

nextPage() {
  if (this.currentPage < this.totalPages) {
    this.currentPage++;
    this.updatePaginatedUsers();
  }
}

prevPage() {
  if (this.currentPage > 1) {
    this.currentPage--;
    this.updatePaginatedUsers();
  }
}

goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }


 DeleteUser(id: number, nom: string, prenom: string, role: string) {
  Swal.fire({
    title: 'Confirmation',
    html: `Voulez-vous vraiment supprimer <b>${nom} ${prenom} -${role} </b> ?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Confirmer',
    cancelButtonText: 'Annuler',
    reverseButtons: true
  }).then((result) => {
    if (result.isConfirmed) {
      this.userService.deleteUser(id).subscribe({
        next: (res) => {
          Swal.fire('Supprimé', 'La suppression est effectuée avec succès.', 'success');
          this.loadUsers();
        },
        error: (err) => {
          Swal.fire('Erreur', 'Erreur lors de la suppression.', 'error');
          console.error('Erreur suppression', err);
        }
      });
    }
  });
}


onEdit(user: User) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    Swal.fire('Erreur', 'Utilisateur non authentifié.', 'error');
    return;
  }

  const payload = JSON.parse(atob(token.split('.')[1]));
  const currentUserRole = payload.role;

  // Déterminer si l'utilisateur peut changer le département
  let disableDepartement = currentUserRole !== 'superadmin';

  this.departementService.getDepartments().subscribe({
    next: (departements) => {
      const userDepartementId = user.departementId || (user.departement?.id ?? null);

      const departementOptions = departements.map(dep => `
        <option value="${dep.id}" ${userDepartementId === dep.id ? 'selected' : ''}>
          ${dep.nomDepartement}
        </option>
      `).join('');

      Swal.fire({
        title: 'Modifier l’utilisateur',
        html: `
          <form>
            <div class="row">
              <div class="col-md-6">
                <div class="form-group">
                  <input id="swal-nom" type="text" class="form-control" placeholder="Nom" value="${user.nom || ''}">
                  <div id="error-nom" style="color:red; font-size:0.85em; margin-top:4px; margin-bottom:8px;"></div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group">
                  <input id="swal-prenom" type="text" class="form-control" placeholder="Prénom" value="${user.prenom || ''}">
                  <div id="error-prenom" style="color:red; font-size:0.85em; margin-top:4px; margin-bottom:8px;"></div>
                </div>
              </div>
            </div>

            <div class="row">
              <div class="col-md-6">
                <div class="form-group">
                  <input id="swal-email" type="email" class="form-control" placeholder="Email" value="${user.email || ''}">
                  <div id="error-email" style="color:red; font-size:0.85em; margin-top:4px; margin-bottom:8px;"></div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="form-group">
                  <div class="input-group mb-4">
                    <div class="input-group-prepend">
                      <span class="input-group-text"><i class="ni ni-mobile-button"></i></span>
                    </div>
                    <input id="swal-numero" type="text" class="form-control" placeholder="Numéro de téléphone" value="${user.numero || ''}">
                  </div>
                  <div id="error-numero" style="color:red; font-size:0.85em; margin-top:-16px; margin-bottom:8px;"></div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <select id="swal-departement" class="form-control form-control-alternative" ${disableDepartement ? 'disabled' : ''}>
                ${departementOptions}
              </select>
              <div id="error-departementId" style="color:red; font-size:0.85em; margin-top:4px; margin-bottom:8px;"></div>
            </div>
          </form>
        `,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'Modifier',
        cancelButtonText: 'Annuler',
        didOpen: () => {
          (document.getElementById('swal-nom') as HTMLInputElement)?.focus();
        },
        preConfirm: () => {
          ['nom', 'prenom', 'email', 'numero', 'departementId'].forEach(field => {
            const el = document.getElementById(`error-${field}`);
            if (el) el.textContent = '';
          });

          const nom = (document.getElementById('swal-nom') as HTMLInputElement).value.trim();
          const prenom = (document.getElementById('swal-prenom') as HTMLInputElement).value.trim();
          const email = (document.getElementById('swal-email') as HTMLInputElement).value.trim();
          const numeroStr = (document.getElementById('swal-numero') as HTMLInputElement).value.trim();
          const numero = Number(numeroStr);
          const departementId = disableDepartement
            ? userDepartementId
            : Number((document.getElementById('swal-departement') as HTMLSelectElement).value);

          let hasError = false;

          if (!nom) { document.getElementById('error-nom')!.textContent = 'Le nom est requis.'; hasError = true; }
          if (!prenom) { document.getElementById('error-prenom')!.textContent = 'Le prénom est requis.'; hasError = true; }
          if (!email) {
            document.getElementById('error-email')!.textContent = "L'email est requis."; hasError = true;
          } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            document.getElementById('error-email')!.textContent = "L'email n'est pas valide."; hasError = true;
          }
          if (!numeroStr) { document.getElementById('error-numero')!.textContent = 'Le numéro est requis.'; hasError = true; }
          else if (isNaN(numero) || numeroStr.length !== 8) {
            document.getElementById('error-numero')!.textContent = 'Le numéro doit contenir exactement 8 chiffres.'; hasError = true;
          }
          if (isNaN(departementId) || departementId === 0) {
            document.getElementById('error-departementId')!.textContent = 'Le département est invalide.'; hasError = true;
          }

          return hasError ? false : { nom, prenom, email, numero, departementId };
        }
      }).then((result) => {
        if (result.isConfirmed && result.value) {
          this.userService.updateUser(user.id, result.value).subscribe({
            next: () => {
              Swal.fire('Succès', 'Modification réussie.', 'success');
              this.loadUsers();
            },
            error: (err) => {
              Swal.fire('Erreur', 'Une erreur est survenue lors de la mise à jour.', 'error');
              console.error('Erreur mise à jour utilisateur :', err);
            }
          });
        }
      });
    },
    error: (err) => {
      Swal.fire('Erreur', 'Impossible de charger les départements.', 'error');
      console.error('Erreur chargement départements :', err);
    }
  });
}






  





}
