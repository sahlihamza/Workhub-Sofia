import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationDialogComponent } from '../../components/confirmation-dialog/confirmation-dialog.component';
import { TeamService, Team } from '../../services/team.service';
import { DepartementService, Department } from '../../services/departement.service';
import { UserService} from '../../services/user.service';
import { User } from '../../models/user.model';
import { forkJoin, of, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-teams',
  templateUrl: './teams.component.html',
  styleUrls: ['./teams.component.scss']
})
export class TeamsComponent implements OnInit {

  @ViewChild('viewTeamModal', { static: true }) viewTeamModal: TemplateRef<any>;

  teams: Team[] = [];
  filteredTeams: Team[] = [];
  departments: Department[] = [];
  users: User[] = [];
  allUsersForLookup: User[] = [];
  teamForm: FormGroup;
  isEditing = false;
  currentTeamId: number | null = null;
  currentUser: User | null = null;
  selectedTeam: Team | null = null;
  teamMembers: User[] = [];
  availableCollaborators: User[] = [];
  selectedCollaboratorId: number | null = null;
  isCreateDisabled = true;
  tooltipMessage = '';
  totalMembers = 0;
  currentPage = 1;
  pageSize = 5;

  p: number = 1;
  searchTerm: string = '';

  constructor(
    private fb: FormBuilder,
    private teamService: TeamService,
    private departmentService: DepartementService,
    private userService: UserService,
    private modalService: NgbModal,
    private toastr: ToastrService
  ) {
    this.teamForm = this.fb.group({
      nomEquipe: ['', Validators.required],
      descriptionEquipe: ['', Validators.required],
      nbMembres: [0, [Validators.required, Validators.min(0)]],
      responsableEquipeId: [null, Validators.required],
      departementId: [{ value: null, disabled: false }, Validators.required]
    });
  }

  ngOnInit(): void {
    this.userService.getProfile().subscribe(user => {
      this.currentUser = user;
      if ((user.role === 'admin' && !user.departementId) || user.role === 'manager') {
        this.isCreateDisabled = true;
        this.tooltipMessage = user.role === 'admin'
          ? 'Not assigned to a department'
          : 'Managers can only edit their existing team.';
      } else {
        this.isCreateDisabled = false;
        this.tooltipMessage = '';
      }

      this.reloadData();
      this.configureFormForRole();
    });
  }

  applyFilter(): void {
    this.filteredTeams = this.teams.filter(team =>
      team.nomEquipe.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.p = 1;
  }

  reloadData(): void {
    if (!this.currentUser) return;

    const role = this.currentUser.role;
    const departmentId = this.currentUser.departementId;
    const userId = this.currentUser.id;
    const eqId = this.currentUser.equipeId;

    let teams$: Observable<Team[]>;
    switch (role) {
      case 'manager':
        teams$ = this.teamService.getTeamById(eqId).pipe(map(team => [team]));
        break;
      case 'admin':
        teams$ = departmentId ? this.teamService.getTeamsByDepartmentId(departmentId) : of([]);
        break;
      default:
        teams$ = this.teamService.getTeams();
    }

    const departments$ = (role === 'admin' && departmentId)
      ? this.departmentService.getDepartmentById(departmentId).pipe(map(dept => [dept]))
      : this.departmentService.getDepartments();

    const availableLeads$ = this.userService.getAvailableTeamLeads();
    const allUsersForLookup$ = this.userService.findUsersByRole(['manager', 'collaborateur']);

    forkJoin({
      teams: teams$.pipe(catchError(() => of([]))),
      departments: departments$.pipe(catchError(() => of([]))),
      availableLeads: availableLeads$.pipe(catchError(() => of([]))),
      allUsersForLookup: allUsersForLookup$.pipe(catchError(() => of([]))),
    }).subscribe(({ teams, departments, availableLeads, allUsersForLookup }) => {
      this.teams = teams;
      this.departments = departments;
      this.users = availableLeads;
      this.allUsersForLookup = allUsersForLookup;
      this.applyFilter();
    });
  }

  configureFormForRole(): void {
    const departementControl = this.teamForm.get('departementId');
    const responsableControl = this.teamForm.get('responsableEquipeId');
    const nomControl = this.teamForm.get('nomEquipe');
    const descriptionControl = this.teamForm.get('descriptionEquipe');

    if (this.currentUser?.role === 'admin') {
      if (this.currentUser.departementId) {
        departementControl?.setValue(this.currentUser.departementId);
        departementControl?.disable();
        responsableControl?.enable();
      } else {
        departementControl?.disable();
        responsableControl?.disable();
      }
    } else if (this.currentUser?.role === 'manager') {
      departementControl?.disable();
      responsableControl?.disable();
      nomControl?.enable();
      descriptionControl?.enable();
    } else {
      this.teamForm.enable();
    }
  }

  viewTeam(team: Team): void {
    this.selectedTeam = team;
    this.currentPage = 1;
    this.loadTeamMembers();
    this.modalService.open(this.viewTeamModal, { size: 'lg' });
  }

  loadTeamMembers(): void {
    if (!this.selectedTeam) return;
    this.userService.getUsersByTeamPaginated(this.selectedTeam.id, this.currentPage, this.pageSize)
      .subscribe(response => {
        this.teamMembers = response.data;
        this.totalMembers = response.total;
      });
  }

  removeMemberFromTeam(member: User): void {
    const modalRef = this.modalService.open(ConfirmationDialogComponent);
    modalRef.componentInstance.title = 'Remove Member';
    modalRef.componentInstance.message = `Are you sure you want to remove ${member.prenom} ${member.nom} from this team?`;

    modalRef.result.then((result) => {
      if (result) {
        this.userService.unassignTeam(member.id).subscribe(() => {
          this.toastr.success(`${member.prenom} ${member.nom} was removed from the team.`, 'Success');
          if (this.selectedTeam && this.selectedTeam.responsable?.id === member.id) {
            this.selectedTeam.responsable = null;
          }
          this.reloadData();
          this.loadTeamMembers();
        });
      }
    });
  }

  pageChanged(page: number): void {
    this.currentPage = page;
    this.loadTeamMembers();
  }

  onSubmit(): void {
    if (this.teamForm.invalid) {
      this.teamForm.markAllAsTouched();
      return;
    }

    const formValue = this.teamForm.getRawValue();

    const operation = this.isEditing
      ? this.teamService.updateTeam(this.currentTeamId!, formValue)
      : this.teamService.createTeam(formValue);

    operation.subscribe({
      next: () => {
        const message = this.isEditing ? 'Team updated successfully!' : 'Team created successfully!';
        this.toastr.success(message, 'Success');
        this.resetForm();
        this.reloadData();
      },
      error: (err) => {
        this.toastr.error(err.error?.message || 'An unexpected error occurred.', 'Error');
      }
    });
  }

  editTeam(team: Team): void {
    this.isEditing = true;
    this.currentTeamId = team.id;

    this.teamForm.patchValue({
      nomEquipe: team.nomEquipe,
      descriptionEquipe: team.descriptionEquipe,
      nbMembres: team.nbMembres,
      departementId: team.departement?.id,
      responsableEquipeId: team.responsable?.id
    });
    this.configureFormForRole();
  }

  deleteTeam(id: number, teamName: string): void {
    const modalRef = this.modalService.open(ConfirmationDialogComponent);
    modalRef.componentInstance.title = 'Delete Team';
    modalRef.componentInstance.message = `Are you sure you want to delete the "${teamName}" team?`;

    modalRef.result.then((result) => {
      if (result) {
        this.teamService.deleteTeam(id).subscribe({
          next: () => {
            this.toastr.success(`Team "${teamName}" was deleted successfully.`, 'Deleted');
            this.reloadData();
          },
          error: (err) => {
            this.toastr.error('Failed to delete team. It may be in use.', 'Error');
          }
        });
      }
    });
  }

  resetForm(): void {
    this.isEditing = false;
    this.currentTeamId = null;
    this.teamForm.enable();
    this.teamForm.reset({
      nbMembres: 0
    });
    this.configureFormForRole();
  }

  getDepartmentName(departmentId: number): string {
    const dept = this.departments.find(d => d.id === departmentId);
    return dept ? dept.nomDepartement : 'N/A';
  }

  getTeamLeadName(userId: number): string {
    const user = this.allUsersForLookup.find(u => u.id === userId);
    return user ? `${user.prenom} ${user.nom}` : 'N/A';
  }

  openAddMemberModal(content: any, team: Team): void {
    this.selectedTeam = team;
    this.userService.getAvailableCollaborators().subscribe(users => {
      this.availableCollaborators = users;
      this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' });
    });
  }

  addMemberToTeam(): void {
    if (!this.selectedCollaboratorId || !this.selectedTeam) {
      return;
    }

    this.userService.assignTeamToUser(this.selectedCollaboratorId, this.selectedTeam.id).subscribe(() => {
      this.toastr.success('Member added to the team successfully.', 'Success');
      this.reloadData();
      this.selectedCollaboratorId = null;
    });
  }
}
