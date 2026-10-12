import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { switchMap, of } from 'rxjs';
import { Poste, PostesService } from '../../services/postes.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { ConfirmationDialogComponent } from '../../components/confirmation-dialog/confirmation-dialog.component';
import { ToastrService } from 'ngx-toastr';
import { DepartementService, Department } from '../../services/departement.service';

@Component({
  selector: 'app-postes',
  templateUrl: './postes.component.html',
  styleUrls: ['./postes.component.scss']
})
export class PostesComponent implements OnInit {

  posteForm: FormGroup;
  isEditing = false;

  postes: Poste[] = [];
  filteredPostes: Poste[] = [];
  selectedPosteIdForEdit: number | null = null;

  users: User[] = [];
  departments: Department[] = [];
  filteredCollaborators: User[] = [];
  availableCollaborators: User[] = [];
  selectedUser: User | null = null;
  selectedPosteId: number | null = null;

  p1: number = 1;
  searchTermPostes: string = '';
  p2: number = 1;
  searchTermCollaborators: string = '';
  availablePostesForAssignment: Poste[] = [];
  submitted = false;
  selectedPoste: Poste | null = null;

  constructor(
    private fb: FormBuilder,
    private postesService: PostesService,
    private userService: UserService,
    private departmentService: DepartementService,
    private modalService: NgbModal,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadAllData();
    this.listenForDepartmentChanges();
  }

  initForm(): void {
    this.posteForm = this.fb.group({
      nomPoste: ['', Validators.required],
      description: [''],
      departementId: [null, Validators.required],
      collaborateurId: [{ value: null, disabled: true }]
    });
  }

  listenForDepartmentChanges(): void {
    this.posteForm.get('departementId')?.valueChanges.subscribe(departmentId => {
      const collaborateurControl = this.posteForm.get('collaborateurId');
      collaborateurControl?.reset();

      if (departmentId) {
        this.userService.getUsersByDepartment(departmentId).subscribe(users => {
          this.availableCollaborators = users.filter(u => !u.poste);
          collaborateurControl?.enable();
        });
      } else {
        this.availableCollaborators = [];
        collaborateurControl?.disable();
      }
    });
  }

  loadAllData(): void {
    this.loadPostes();
    this.loadUsers();
    this.departmentService.getDepartments().subscribe(data => {
      this.departments = data;
    });
  }

  loadPostes(): void {
    this.postesService.getPostes().subscribe(data => {
      this.postes = data;
      this.applyFilterPostes();
    });
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe(data => {
      this.users = data;
      this.applyFilterCollaborators();
    });
  }

  applyFilterPostes(): void {
    this.filteredPostes = this.postes.filter(poste =>
      poste.nomPoste.toLowerCase().includes(this.searchTermPostes.toLowerCase())
    );
    this.p1 = 1;
  }

  applyFilterCollaborators(): void {
    const collaborators = this.users.filter(user => user.role === 'collaborateur');
    this.filteredCollaborators = collaborators.filter(user =>
      (user.prenom + ' ' + user.nom).toLowerCase().includes(this.searchTermCollaborators.toLowerCase())
    );
    this.p2 = 1;
  }

  public get collaborators(): User[] {
    return this.filteredCollaborators;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.posteForm.invalid) {
      return;
    }
    this.submitted = false;
    const formValue = this.posteForm.getRawValue();

    if (this.isEditing && this.selectedPosteIdForEdit !== null) {
      const updatePayload = {
        nomPoste: formValue.nomPoste,
        description: formValue.description,
        departementId: formValue.departementId
      };

      const originalPoste = this.postes.find(p => p.id === this.selectedPosteIdForEdit);
      const departmentHasChanged = originalPoste?.departement.id !== formValue.departementId;

      const performUpdate = () => {
        this.postesService.updatePoste(this.selectedPosteIdForEdit, updatePayload).subscribe(() => {
          this.toastr.success('Position updated successfully!', 'Success');
          this.loadAllData();
          this.resetForm();
        });
      };

      if (departmentHasChanged) {
        const modalRef = this.modalService.open(ConfirmationDialogComponent);
        modalRef.componentInstance.title = 'Confirm Department Change';
        modalRef.componentInstance.message = 'Changing the department will unassign all current users from this position. Are you sure you want to proceed?';
        modalRef.componentInstance.confirmButtonText = 'Confirm';
        modalRef.componentInstance.confirmButtonClass = 'btn-warning';

        modalRef.result.then((result) => {
          if (result) {
            performUpdate();
          }
        });
      } else {
        performUpdate();
      }
    } else {
      const { collaborateurId, ...posteData } = formValue;
      this.postesService.addPoste(posteData).pipe(
        switchMap((newlyCreatedPoste: Poste) => {
          if (collaborateurId) {
            return this.userService.assignPosition(collaborateurId, newlyCreatedPoste.id);
          }
          return of(null);
        })
      ).subscribe(() => {
        this.toastr.success('Position created successfully!', 'Success');
        this.loadAllData();
        this.resetForm();
      });
    }
  }

  editPoste(poste: Poste): void {
    this.isEditing = true;
    this.selectedPosteIdForEdit = poste.id;
    this.posteForm.patchValue({
      nomPoste: poste.nomPoste,
      description: poste.description,
      departementId: poste.departement?.id
    });
    this.posteForm.get('collaborateurId')?.disable();
    this.posteForm.get('departementId')?.enable();
    window.scrollTo(0, 0);
  }

  deletePoste(id: number): void {
    const modalRef = this.modalService.open(ConfirmationDialogComponent);
    modalRef.componentInstance.title = 'Delete Position';
    modalRef.componentInstance.message = 'Are you sure you want to delete this position? This could affect assigned users.';

    modalRef.result.then((result) => {
      if (result) {
        this.postesService.deletePoste(id).subscribe({
          next: () => {
            this.toastr.success('Position deleted successfully.', 'Deleted');
            this.loadPostes();
          },
          error: (err) => {
            this.toastr.error('Could not delete position. It may be in use.', 'Error');
          }
        });
      }
    });
  }

  resetForm(): void {
    this.isEditing = false;
    this.selectedPosteIdForEdit = null;
    this.posteForm.get('collaborateurId')?.enable();
    this.posteForm.get('departementId')?.enable();
    this.posteForm.reset();
    this.submitted = false;
  }


  openAssignModal(content: any, user: User): void {
    if (!user.departementId) {
      this.toastr.warning(`${user.prenom} is not assigned to a department and cannot be assigned a position.`);
      return;
    }

    this.selectedUser = user;
    this.selectedPosteId = user.poste?.id || null;

    this.postesService.getPostesByDepartment(user.departementId).subscribe(postes => {
      this.availablePostesForAssignment = postes;
      this.modalService.open(content);
    });
  }

  confirmAssignment(): void {
    if (!this.selectedUser || this.selectedPosteId === null) {
      return;
    }
    const numericPosteId = Number(this.selectedPosteId);
    this.userService.assignPosition(this.selectedUser.id, numericPosteId).subscribe(() => {
      this.toastr.success(`Position assigned to ${this.selectedUser.prenom} ${this.selectedUser.nom}.`, 'Success');
      this.loadUsers();
    });
  }

  unassignPosition(user: User): void {
    const modalRef = this.modalService.open(ConfirmationDialogComponent);
    modalRef.componentInstance.title = 'Unassign Position';
    modalRef.componentInstance.message = `Are you sure you want to unassign ${user.prenom} from their position?`;

    modalRef.result.then((result) => {
      if (result) {
        this.userService.assignPosition(user.id, null).subscribe(() => {
          this.toastr.success(`Position unassigned from ${user.prenom} ${user.nom}.`, 'Success');
          this.loadUsers();
        });
      }
    });
  }

  openViewModal(content: any, poste: Poste): void {
    this.selectedPoste = poste;
    this.modalService.open(content, { size: 'lg' });
  }
}
