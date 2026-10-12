import { Component, OnInit, ViewChild, ElementRef, TemplateRef, HostListener } from '@angular/core';
import { ScheduleService } from '../../services/schedule.service';
import { ScheduleEntry } from '../../models/schedule-entry.model';
import { HttpErrorResponse } from '@angular/common/http';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';
import { Observable, forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Department, DepartementService } from '../../services/departement.service';
import { Team, TeamService } from '../../services/team.service';
import { ToastrService } from "ngx-toastr";
import { CampaignService } from '../../services/campaign.service';
import { Campaign } from '../../models/campaign.model';
import {LayoutService} from "../../services/layout.service";
@Component({
  selector: 'app-admin-planning',
  templateUrl: './admin-planning.component.html',
  styleUrls: ['./admin-planning.component.scss']
})
export class AdminPlanningComponent implements OnInit {
  @ViewChild('editModal', { static: true }) editModal: TemplateRef<any>;
  @ViewChild('scrollContainer') private scrollContainer: ElementRef;
  public showFilters = false;
  masterUserList: User[] = [];
  allUsers: User[] = [];
  allDepartments: Department[] = [];
  allTeams: Team[] = [];
  allCampaigns: Campaign[] = [];
  activeCampaigns: Campaign[] = [];

  selectedUserId: number | null = null;
  currentUser: User | null = null;

  searchTerm: string = '';
  selectedDepartmentId: number | null = null;
  selectedTeamId: number | null = null;

  currentDate: Date = new Date();
  selectedDate: Date | null = null;
  calendarDays: Array<{ date: Date, entry?: ScheduleEntry, campaignColor?: string | null }> = [];
  scheduleMap: Map<string, ScheduleEntry> = new Map();
  modalRef: NgbModalRef;

  selectedStatus: 'present' | 'remote' | 'holiday' = 'present';
  notes: string = '';
  isFullscreen = false;

  campaignColorByDate = new Map<string, string>();
  campaignsByDate = new Map<string, Campaign[]>();
  campaignColors: string[] = [
    '#5e72e4', '#2dce89', '#11cdef', '#fb6340', '#f5365c',
    '#ffd600', '#8965e0', '#32325d'
  ];

  constructor(
    private scheduleService: ScheduleService,
    private userService: UserService,
    private departmentService: DepartementService,
    private teamService: TeamService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private campaignService: CampaignService,
    private layoutService: LayoutService
  ) { }

  @HostListener('wheel', ['$event'])
  onWheelScroll(event: WheelEvent) {
    if (this.scrollContainer && this.scrollContainer.nativeElement.contains(event.target) && !this.isFullscreen) {
      event.preventDefault();
      this.scrollContainer.nativeElement.scrollLeft += event.deltaY;
    }
  }

  ngOnInit(): void {
    this.userService.getProfile().subscribe(user => {
      this.currentUser = user;
      this.loadInitialData();
    });
  }

  ngOnDestroy(): void {
    if (this.isFullscreen) {
      document.body.classList.remove('fullscreen-mode');
      this.layoutService.exitFullscreen();
    }
  }

  toggleFullscreen(): void {
    this.isFullscreen = !this.isFullscreen;
    if (this.isFullscreen) {
      document.body.classList.add('fullscreen-mode');
      this.layoutService.enterFullscreen();
    } else {
      document.body.classList.remove('fullscreen-mode');
      this.layoutService.exitFullscreen();
      setTimeout(() => this.scrollToToday(), 0);
    }
  }
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  loadInitialData(): void {
    if (!this.currentUser) return;

    const { role, departementId, equipeId } = this.currentUser;

    let users$: Observable<User[]>;
    let departments$: Observable<Department[]>;
    let teams$: Observable<Team[]>;
    let campaigns$ = this.campaignService.getCampaigns();

    if (role === 'superadmin') {
      users$ = this.userService.findAllUsersSimple();
      departments$ = this.departmentService.getDepartments();
      teams$ = this.teamService.getTeams();
    } else if (role === 'admin' && departementId) {
      users$ = this.userService.getViewableUsers();
      departments$ = this.departmentService.getDepartmentById(departementId).pipe(map(dept => [dept]));
      teams$ = this.teamService.getTeamsByDepartmentId(departementId);
    } else if (role === 'manager' && departementId && equipeId) {
      users$ = this.userService.getViewableUsers();
      departments$ = this.departmentService.getDepartmentById(departementId).pipe(map(dept => [dept]));
      teams$ = this.teamService.getTeamById(equipeId).pipe(map(team => [team]));
    } else {
      users$ = of([]);
      departments$ = of([]);
      teams$ = of([]);
    }

    forkJoin({
      users: users$,
      departments: departments$,
      teams: teams$,
      campaigns: campaigns$
    }).subscribe(({ users, departments, teams, campaigns }) => {
      this.masterUserList = users;
      this.allUsers = users;
      this.allDepartments = departments;
      this.allTeams = teams;
      this.allCampaigns = campaigns;
      this.mapCampaignColorsToDates();
      this.updateActiveCampaign();
    });
  }

  updateActiveCampaign(): void {
    const monthStart = startOfMonth(this.currentDate);
    const monthEnd = endOfMonth(this.currentDate);

    const campaigns = this.allCampaigns.filter(campaign => {
      const campaignStart = new Date(campaign.startDate);
      const campaignEnd = new Date(campaign.endDate);
      return campaignStart <= monthEnd && campaignEnd >= monthStart;
    });

    campaigns.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    this.activeCampaigns = campaigns;
  }

  mapCampaignColorsToDates(): void {
    this.campaignColorByDate.clear();
    this.campaignsByDate.clear();
    this.allCampaigns.forEach(campaign => {
      const color = this.campaignColors[campaign.id % this.campaignColors.length];
      const start = parseISO(campaign.startDate);
      const end = parseISO(campaign.endDate);
      for (let dt = start; dt <= end; dt.setDate(dt.getDate() + 1)) {
        const dateString = format(dt, 'yyyy-MM-dd');
        this.campaignColorByDate.set(dateString, color);

        if (!this.campaignsByDate.has(dateString)) {
          this.campaignsByDate.set(dateString, []);
        }
        this.campaignsByDate.get(dateString)?.push(campaign);
      }
    });
  }

  getCampaignsForDay(day: Date | null): Campaign[] {
    if (!day) return [];
    const dateString = format(day, 'yyyy-MM-dd');
    return this.campaignsByDate.get(dateString) || [];
  }

  getCampaignTooltip(day: Date | null): string | null {
    if (!day) return null;
    const campaigns = this.getCampaignsForDay(day);
    if (campaigns.length === 0) {
      return null;
    }
    return campaigns.map(c => c.name).join(' / ');
  }

  applyFilters(): void {
    let filtered = [...this.masterUserList];

    if (this.searchTerm) {
      const lowerCaseSearch = this.searchTerm.toLowerCase();
      filtered = filtered.filter(user =>
        (user.prenom + ' ' + user.nom).toLowerCase().includes(lowerCaseSearch)
      );
    }
    if (this.selectedDepartmentId) {
      filtered = filtered.filter(user => user.departementId === this.selectedDepartmentId);
    }
    if (this.selectedTeamId) {
      filtered = filtered.filter(user => user.equipeId === this.selectedTeamId);
    }

    this.allUsers = filtered;
    this.selectedUserId = null;
    this.calendarDays = [];
  }

  onUserChange(): void {
    if (this.selectedUserId) {
      this.currentDate = new Date();
      this.updateActiveCampaign();
      this.loadMonthData(true);
    }
  }

  loadMonthData(scrollToToday: boolean = false): void {
    if (!this.selectedUserId) return;

    this.scheduleService.getEntriesForMonth(this.currentDate, this.selectedUserId).subscribe(entries => {
      this.scheduleMap.clear();
      for (const entry of entries) {
        const entryDate = new Date(entry.date);
        const userTimezoneOffset = entryDate.getTimezoneOffset() * 60000;
        this.scheduleMap.set(new Date(entryDate.getTime() + userTimezoneOffset).toDateString(), entry);
      }
      this.generateCalendarDays();
      if (scrollToToday) {
        setTimeout(() => this.scrollToToday(), 0);
      }
    });
  }

  generateCalendarDays(): void {
    this.calendarDays = [];
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const lastDay = new Date(year, month + 1, 0);

    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateString = format(date, 'yyyy-MM-dd');
      const entry = this.scheduleMap.get(date.toDateString());
      const campaignColor = this.campaignColorByDate.get(dateString);
      this.calendarDays.push({ date, entry, campaignColor });
    }
  }

  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.updateActiveCampaign();
    this.loadMonthData();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.updateActiveCampaign();
    this.loadMonthData();
  }

  selectDate(date: Date): void {
    if (this.isPastDay(date)) return;

    this.selectedDate = date;
    const entry = this.scheduleMap.get(date.toDateString());

    if (entry) {
      this.selectedStatus = entry.status;
      this.notes = entry.notes || '';
    } else {
      this.selectedStatus = 'present';
      this.notes = '';
    }
    this.modalRef = this.modalService.open(this.editModal);
  }

  saveStatus(): void {
    if (!this.selectedDate || !this.selectedUserId) return;

    const dateString = format(this.selectedDate, 'yyyy-MM-dd');

    const entry: Partial<ScheduleEntry> = {
      date: dateString,
      status: this.selectedStatus,
      notes: this.notes.trim() || undefined
    };

    this.scheduleService.saveEntry(entry, this.selectedUserId).subscribe(() => {
      this.loadMonthData();
      this.modalRef.close();
    });
  }

  deleteEntry(): void {
    if (!this.selectedDate || !this.selectedUserId) return;

    const dateString = format(this.selectedDate, 'yyyy-MM-dd');

    this.scheduleService.deleteEntry(dateString, this.selectedUserId).subscribe({
      next: () => {
        this.loadMonthData();
        this.modalRef.close();
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.loadMonthData();
          this.modalRef.close();
        } else {
          console.error('Error deleting entry:', err);
        }
      }
    });
  }

  isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6;
  }

  isPastDay(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  }

  scrollToToday(): void {
    if (!this.scrollContainer || this.isFullscreen) return;
    const container = this.scrollContainer.nativeElement;
    const todayElement = container.querySelector('.today');

    if (todayElement) {
      todayElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  getMonthYearString(): string {
    return this.currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  }

  setStatus(date: Date, newStatus: 'present' | 'remote', event: MouseEvent): void {
    event.stopPropagation();
    if (this.isPastDay(date) || !this.selectedUserId) return;

    const dateString = format(date, 'yyyy-MM-dd');
    const dateKey = date.toDateString();
    const existingEntry = this.scheduleMap.get(dateKey);
    const originalEntry = existingEntry ? { ...existingEntry } : undefined;

    const optimisticEntry: ScheduleEntry = {
      ...(existingEntry || {}),
      id: existingEntry?.id,
      date: dateString,
      status: newStatus,
      user: { id: this.selectedUserId }
    };
    this.scheduleMap.set(dateKey, optimisticEntry);
    this.generateCalendarDays();
    const isTogglingOff = existingEntry && existingEntry.status === newStatus;
    const operation$ = isTogglingOff
      ? this.scheduleService.deleteEntry(dateString, this.selectedUserId)
      : this.scheduleService.saveEntry(optimisticEntry, this.selectedUserId);

    operation$.subscribe({
      error: () => {
        if (originalEntry) {
          this.scheduleMap.set(dateKey, originalEntry);
        } else {
          this.scheduleMap.delete(dateKey);
        }
        this.generateCalendarDays();
        this.toastr.error('Could not save planning update.', 'Sync Error');
      }
    });
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.updateActiveCampaign();
    this.loadMonthData(true);
  }

  isCurrentMonthView(): boolean {
    const today = new Date();
    return this.currentDate.getMonth() === today.getMonth() &&
      this.currentDate.getFullYear() === today.getFullYear();
  }

  downloadPlanningReport(): void {
    let filters: { searchTerm?: string; departmentId?: number; teamId?: number; userId?: number } = {};

    if (this.selectedUserId) {
      filters = { userId: this.selectedUserId };
    } else {
      filters = {
        searchTerm: this.searchTerm || undefined,
        departmentId: this.selectedDepartmentId || undefined,
        teamId: this.selectedTeamId || undefined,
      };
    }

    this.scheduleService.exportPlanning(filters).subscribe(response => {
      const header = response.headers.get('content-disposition');
      const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
      const matches = filenameRegex.exec(header);
      const filename = (matches && matches[1]) ? matches[1].replace(/['"]/g, '') : 'planning-export.xlsx';

      const blob = new Blob([response.body], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);

      a.href = objectUrl;
      a.download = filename;
      a.click();

      URL.revokeObjectURL(objectUrl);
    });
  }
}
