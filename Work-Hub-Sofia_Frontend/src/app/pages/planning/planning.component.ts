import { Component, OnInit, ViewChild, ElementRef, TemplateRef, HostListener  } from '@angular/core';
import { ScheduleService } from '../../services/schedule.service';
import { ScheduleEntry } from '../../models/schedule-entry.model';
import { HttpErrorResponse } from '@angular/common/http';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { CampaignService } from '../../services/campaign.service';
import { Campaign } from '../../models/campaign.model';
import { LayoutService} from "../../services/layout.service";

@Component({
  selector: 'app-planning',
  templateUrl: './planning.component.html',
  styleUrls: ['./planning.component.scss']
})
export class PlanningComponent implements OnInit {
  @ViewChild('editModal', { static: true }) editModal: TemplateRef<any>;
  @ViewChild('scrollContainer') private scrollContainer: ElementRef;

  currentDate: Date = new Date();
  selectedDate: Date | null = null;
  calendarDays: Array<{ date: Date, entry?: ScheduleEntry, campaignColor?: string | null }> = [];
  scheduleMap: Map<string, ScheduleEntry> = new Map();
  modalRef: NgbModalRef;

  selectedStatus: 'present' | 'remote' | 'holiday' = 'present';
  notes: string = '';
  isFullscreen = false;

  allCampaigns: Campaign[] = [];
  activeCampaigns: Campaign[] = [];
  campaignColorByDate = new Map<string, string>();
  campaignsByDate = new Map<string, Campaign[]>();

  campaignColors: string[] = [
    '#5e72e4', '#2dce89', '#11cdef', '#fb6340', '#f5365c',
    '#ffd600', '#8965e0', '#32325d'
  ];

  constructor(
    private scheduleService: ScheduleService,
    private modalService: NgbModal,
    private campaignService: CampaignService,
    private layoutService: LayoutService,
  ) { }

  @HostListener('wheel', ['$event'])
  onWheelScroll(event: WheelEvent) {
    if (this.scrollContainer && this.scrollContainer.nativeElement.contains(event.target) && !this.isFullscreen) {
      event.preventDefault();
      this.scrollContainer.nativeElement.scrollLeft += event.deltaY;
    }
  }

  ngOnInit(): void {
    this.loadMonthData(true);
    this.campaignService.getCampaigns().subscribe(campaigns => {
      this.allCampaigns = campaigns;
      this.mapCampaignColorsToDates();
      this.updateActiveCampaign();
      this.generateCalendarDays();
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

  loadMonthData(scrollToToday: boolean = false): void {
    this.scheduleService.getEntriesForMonth(this.currentDate).subscribe(entries => {
      this.scheduleMap.clear();
      for (const entry of entries) {
        const entryDate = new Date(entry.date);
        const userTimezoneOffset = entryDate.getTimezoneOffset() * 60000;
        this.scheduleMap.set(new Date(entryDate.getTime() + userTimezoneOffset).toDateString(), entry);
      }
      this.generateCalendarDays();
      if (scrollToToday && !this.isFullscreen) {
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

  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.loadMonthData();
    this.updateActiveCampaign();
    this.generateCalendarDays();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.loadMonthData();
    this.updateActiveCampaign();
    this.generateCalendarDays();
  }

  selectDate(date: Date): void {
    if (this.isPastDay(date)) return;
    this.selectedDate = date;
    const entry = this.scheduleMap.get(date.toDateString());
    if (entry) {
      this.selectedStatus = entry.status as 'present' | 'remote' | 'holiday';
      this.notes = entry.notes || '';
    } else {
      this.selectedStatus = 'present';
      this.notes = '';
    }
    this.modalRef = this.modalService.open(this.editModal);
  }

  saveStatus(): void {
    if (!this.selectedDate) return;
    const dateString = format(this.selectedDate, 'yyyy-MM-dd');
    const entry: Partial<ScheduleEntry> = {
      date: dateString,
      status: this.selectedStatus,
      notes: this.notes.trim() || undefined
    };
    this.scheduleService.saveEntry(entry).subscribe(() => {
      this.loadMonthData();
      this.modalRef.close();
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
    if (this.isFullscreen) return;
    const container = this.scrollContainer.nativeElement;
    const todayElement = container.querySelector('.today');
    if (todayElement) {
      todayElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  getMonthYearString(): string {
    return this.currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' });
  }

  setStatus(date: Date, status: 'present' | 'remote', event: MouseEvent): void {
    event.stopPropagation();
    if (this.isPastDay(date)) return;
    const dateString = format(date, 'yyyy-MM-dd');
    const existingEntry = this.scheduleMap.get(date.toDateString());
    if (existingEntry && existingEntry.status === status) {
      this.scheduleService.deleteEntry(dateString).subscribe(() => this.loadMonthData());
    } else {
      const entry: Partial<ScheduleEntry> = {
        date: dateString,
        status: status,
        notes: existingEntry?.notes || undefined
      };
      this.scheduleService.saveEntry(entry).subscribe(() => this.loadMonthData());
    }
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.loadMonthData(true);
    this.updateActiveCampaign();
    this.generateCalendarDays();
  }

  isCurrentMonthView(): boolean {
    const today = new Date();
    return this.currentDate.getMonth() === today.getMonth() &&
      this.currentDate.getFullYear() === today.getFullYear();
  }
}
