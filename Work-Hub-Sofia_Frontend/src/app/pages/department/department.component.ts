import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DepartementService, Department } from '../../services/departement.service';
import { UserService} from '../../services/user.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationDialogComponent } from '../../components/confirmation-dialog/confirmation-dialog.component';
import { User } from '../../models/user.model';
import {catchError, forkJoin, of} from "rxjs";
import {ToastrService} from "ngx-toastr";

@Component({
  selector: 'app-department',
  templateUrl: './department.component.html',
  styleUrls: ['./department.component.scss']
})
export class DepartmentComponent implements OnInit {

  departments: Department[] = [];
  filteredDepartments: Department[] = [];
  users: object = [];
  departmentForm: FormGroup;
  isEditing = false;
  currentDepartmentId: number | null = null;
  availableAdmins: User[] = [];
  dropdownAdmins: User[] = [];
  selectedDepartment: Department | null = null;
  departmentMembers: User[] = [];
  totalMembers = 0;
  currentPage = 1;
  pageSize = 5;
  availableMembers: User[] = [];
  selectedMemberId: number | null = null;
  submitted = false;
  isCreateDisabled = false;
  tooltipMessage = '';

  p: number = 1;
  searchTerm: string = '';


  constructor(
    private departmentService: DepartementService,
    private userService: UserService,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private toastr: ToastrService,

  ) {
    this.departmentForm = this.fb.group({
      nomDepartement: ['', Validators.required],
      descriptionDepartement: ['', Validators.required],
      statut: [true, Validators.required],
      responsableId: [null, Validators.required],
      nbEquipe: [0, Validators.required],
    });
  }

  ngOnInit(): void {
    this.reloadData();
  }

  loadDepartments(): void {
    this.departmentService.getDepartments().subscribe(data => {
      this.departments = data;
      this.applyFilter();
    });
  }

  applyFilter(): void {
    this.filteredDepartments = this.departments.filter(dept =>
      dept.nomDepartement.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.p = 1;
  }

  loadAvailableAdmins(): void {
    this.userService.getAvailableDepartmentHeads().subscribe(data => {
      this.availableAdmins = data;
      this.dropdownAdmins = [...data];

      if (this.availableAdmins.length === 0) {
        this.isCreateDisabled = true;
        this.tooltipMessage = 'Cannot create a new department as no department heads are available.';
      } else {
        this.isCreateDisabled = false;
        this.tooltipMessage = '';
      }
    });
  }

  loadUsers(): void {
    const desiredRole = ['admin'];
    this.userService.findUsersByRole(desiredRole).subscribe(data => {
      this.users = data;
    });
  }


  public onSubmit(): void {
    if (this.departmentForm.invalid) {
      this.departmentForm.markAllAsTouched();
      return;
    }

    const operation = this.isEditing
      ? this.departmentService.updateDepartment(this.currentDepartmentId!, this.departmentForm.value)
      : this.departmentService.createDepartment(this.departmentForm.value);

    operation.subscribe({
      next: () => {
        const message = this.isEditing
          ? 'Department updated successfully!'
          : 'Department created successfully!';

        this.toastr.success(message, 'Success');
        this.resetForm();
      },
      error: (err) => {
        if (err.status === 409) {
          this.departmentForm.get('nomDepartement')?.setErrors({
            notUnique: true,
            serverError: err.error?.message || 'This department name is already in use.'
          });
          this.toastr.error(err.error?.message || 'This department name is already in use.', 'Error');
        } else {
          this.toastr.error('This department name is already in use.');
        }
      }
    });
  }

  editDepartment(department: Department): void {
    this.isEditing = true;
    this.currentDepartmentId = department.id;

    this.dropdownAdmins = [...this.availableAdmins];
    const currentResponsable = department.responsable;

    if (currentResponsable && !this.dropdownAdmins.some(admin => admin.id === currentResponsable.id)) {
      this.dropdownAdmins.push(currentResponsable);
    }

    this.departmentForm.patchValue({
      ...department,
      responsableId: currentResponsable ? currentResponsable.id : null,
    });
  }

  deleteDepartment(id: number, departmentName: string): void {
    const modalRef = this.modalService.open(ConfirmationDialogComponent);
    modalRef.componentInstance.title = 'Delete Department';
    modalRef.componentInstance.message = `Are you sure you want to delete the "${departmentName}" department? This action cannot be undone.`;

    modalRef.result.then((result) => {
      if (result) {
        this.departmentService.deleteDepartment(id).subscribe({
          next: () => {
            this.toastr.success(`Department "${departmentName}" was deleted successfully.`, 'Deleted');
            this.loadDepartments();
            this.reloadData();
          },
          error: (err) => {
            this.toastr.error('Failed to delete department. It may be in use.', 'Error');
          }
        });
      }
    }).catch((reason) => {
      console.log(`Dismissed: ${reason}`);
    });
  }

  resetForm(): void {
    this.isEditing = false;
    this.currentDepartmentId = null;
    this.departmentForm.reset({
      statut: true
    });
    this.reloadData();
  }

  openViewModal(content: any, department: Department): void {
    this.selectedDepartment = department;
    this.currentPage = 1;
    this.loadDepartmentMembers();
    this.modalService.open(content, { size: 'lg' });
  }

  openAddMemberModal(content: any): void {
    this.userService.getAvailableMembers().subscribe(users => {
      this.availableMembers = users;
      this.selectedMemberId = null;
      this.modalService.open(content);
    });
  }

  loadDepartmentMembers(): void {
    if (!this.selectedDepartment) return;
    this.userService.getUsersByDepartmentPaginated(this.selectedDepartment.id, this.currentPage, this.pageSize)
      .subscribe(response => {
        this.departmentMembers = response.data;
        this.totalMembers = response.total;
      });
  }

  pageChanged(page: number): void {
    this.currentPage = page;
    this.loadDepartmentMembers();
  }

  confirmAddMember(): void {
    if (!this.selectedMemberId || !this.selectedDepartment) {
      return;
    }

    this.userService.assignDepartment(this.selectedMemberId, this.selectedDepartment.id)
      .subscribe(() => {
        this.loadDepartmentMembers();
      });
  }

  removeMemberFromDepartment(member: User): void {
    const modalRef = this.modalService.open(ConfirmationDialogComponent);
    const isHead = this.selectedDepartment?.responsable?.id === member.id;

    modalRef.componentInstance.title = isHead ? 'Remove Department Head' : 'Remove Member';
    modalRef.componentInstance.message = isHead
      ? `Are you sure you want to remove ${member.prenom} ${member.nom} as head of this department?`
      : `Are you sure you want to remove ${member.prenom} ${member.nom} from this department?`;

    modalRef.result.then((result) => {
      if (result && this.selectedDepartment) {
        const departmentId = this.selectedDepartment.id;

        this.userService.unassignDepartment(member.id).subscribe(() => {
          this.toastr.success(`${member.prenom} ${member.nom} has been unassigned.`);

          this.reloadData();

          this.departmentService.getDepartmentById(departmentId).subscribe(updatedDepartment => {
            this.selectedDepartment = updatedDepartment;
          });
          this.loadDepartmentMembers();
        });
      }
    });
  }

  promoteToHead(member: User): void {
    if (!this.selectedDepartment) return;

    const modalRef = this.modalService.open(ConfirmationDialogComponent);
    modalRef.componentInstance.title = 'Promote to Department Head';
    modalRef.componentInstance.message = `Are you sure you want to make ${member.prenom} ${member.nom} the new head of this department?`;
    modalRef.componentInstance.confirmButtonText = 'Promote';
    modalRef.componentInstance.confirmButtonClass = 'btn-success';

    modalRef.result.then((result) => {
      if (result) {
        this.departmentService.setDepartmentHead(this.selectedDepartment!.id, member.id)
          .subscribe({
            next: () => {
              this.toastr.success(`${member.prenom} ${member.nom} has been promoted to Department Head.`, 'Promotion Successful');

              const departmentId = this.selectedDepartment!.id;
              this.departmentService.getDepartmentById(departmentId).subscribe(updatedDepartment => {
                this.selectedDepartment = updatedDepartment;
              });
              this.loadDepartmentMembers();
              this.loadDepartments();
              this.loadAvailableAdmins();
            },
            error: (err) => {
              const errorMessage = err.error?.message || 'An unexpected error occurred during the promotion.';
              this.toastr.error(errorMessage, 'Promotion Failed');
            }
          });
      }
    });
  }

  reloadData(): void {
    const departments$ = this.departmentService.getDepartments();
    const availableAdmins$ = this.userService.getAvailableDepartmentHeads();

    forkJoin({
      departments: departments$,
      availableAdmins: availableAdmins$
    }).subscribe(({ departments, availableAdmins }) => {
      this.departments = departments;
      this.applyFilter();

      this.availableAdmins = availableAdmins;
      this.dropdownAdmins = [...availableAdmins];

      if (this.availableAdmins.length === 0 && !this.isEditing) {
        this.isCreateDisabled = true;
        this.tooltipMessage = 'Cannot create department: No available department heads.';
      } else {
        this.isCreateDisabled = false;
        this.tooltipMessage = '';
      }
    });
  }
}
