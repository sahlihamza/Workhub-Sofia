import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Campaign } from '../../models/campaign.model';
import { CampaignService } from '../../services/campaign.service';
import { ToastrService } from 'ngx-toastr';
import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, format, parseISO } from 'date-fns';
import { NgbDateStruct, NgbDate, NgbModal, NgbCalendar } from '@ng-bootstrap/ng-bootstrap';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationDialogComponent } from '../../components/confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-campaigns',
  templateUrl: './campaigns.component.html',
  styleUrls: ['./campaigns.component.scss']
})
export class CampaignsComponent implements OnInit {
  campaigns: Campaign[] = [];
  filteredCampaigns: Campaign[] = [];
  campaignForm: FormGroup;
  isEditing = false;
  currentCampaignId: number | null = null;
  submitted = false;

  currentDate: Date = new Date();
  calendarDays: (Date | null)[] = [];
  campaignsByDate = new Map<string, Campaign[]>();

  p: number = 1;
  searchTerm: string = '';

  disabledDates = new Set<string>();
  maxEndDate: NgbDateStruct | null = null;
  minDate: NgbDateStruct;

  constructor(
    private fb: FormBuilder,
    private campaignService: CampaignService,
    private toastr: ToastrService,
    private modalService: NgbModal,
    private calendar: NgbCalendar
  ) {
    this.minDate = this.calendar.getToday();

    this.campaignForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
    });

    this.campaignForm.get('startDate')?.valueChanges.subscribe(startDateValue => {
      this.updateEndDateLogic(startDateValue);
    });
  }

  updateEndDateLogic(startDateValue: NgbDateStruct | null): void {
    const endDateControl = this.campaignForm.get('endDate');
    const endDateValue = endDateControl?.value;

    if (startDateValue && endDateValue) {
      const start = new NgbDate(startDateValue.year, startDateValue.month, startDateValue.day);
      const end = new NgbDate(endDateValue.year, endDateValue.month, endDateValue.day);

      if (end.before(start)) {
        endDateControl.setValue(null);
      }
    }

    if (!startDateValue) {
      this.maxEndDate = null;
      return;
    }

    const selectedStartDate = new Date(startDateValue.year, startDateValue.month - 1, startDateValue.day);
    let nextCampaignStartDate: Date | null = null;

    this.campaigns.forEach(campaign => {
      if (this.isEditing && campaign.id === this.currentCampaignId) {
        return;
      }

      const existingCampaignStart = parseISO(campaign.startDate);
      if (existingCampaignStart > selectedStartDate) {
        if (!nextCampaignStartDate || existingCampaignStart < nextCampaignStartDate) {
          nextCampaignStartDate = existingCampaignStart;
        }
      }
    });

    if (nextCampaignStartDate) {
      const maxDate = new Date(nextCampaignStartDate);
      maxDate.setDate(maxDate.getDate() - 1);
      this.maxEndDate = this.fromJSDateToNgbDateStruct(maxDate);
    } else {
      this.maxEndDate = null;
    }
  }

  ngOnInit(): void {
    this.loadCampaigns();
  }

  loadCampaigns(): void {
    this.campaignService.getCampaigns().subscribe(data => {
      this.campaigns = data;
      this.applyFilter();
      this.calculateDisabledDates();
      this.generateCalendar();
    });
  }

  applyFilter(): void {
    this.filteredCampaigns = this.campaigns.filter(campaign =>
      campaign.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
    this.p = 1;
  }

  generateCalendar(): void {
    const start = startOfMonth(this.currentDate);
    const end = endOfMonth(this.currentDate);
    const daysInMonth = eachDayOfInterval({ start, end });
    this.calendarDays = [...daysInMonth];
    const startingDayOfWeek = getDay(start);
    for (let i = 0; i < startingDayOfWeek; i++) {
      this.calendarDays.unshift(null);
    }
    this.mapCampaignsToDates();
  }

  mapCampaignsToDates(): void {
    this.campaignsByDate.clear();
    this.campaigns.forEach(campaign => {
      const start = parseISO(campaign.startDate);
      const end = parseISO(campaign.endDate);
      for (let dt = start; dt <= end; dt.setDate(dt.getDate() + 1)) {
        const dateString = format(dt, 'yyyy-MM-dd');
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

  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar();
  }

  editCampaign(campaign: Campaign): void {
    this.isEditing = true;
    this.currentCampaignId = campaign.id;
    window.scrollTo(0, 0);
    this.calculateDisabledDates(campaign.id);
    const startDateStruct = this.fromISOStringToNgbDateStruct(campaign.startDate);
    this.campaignForm.patchValue({
      name: campaign.name,
      description: campaign.description,
      startDate: startDateStruct,
      endDate: this.fromISOStringToNgbDateStruct(campaign.endDate)
    });
    this.updateEndDateLogic(startDateStruct);
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.campaignForm.invalid) {
      this.campaignForm.markAllAsTouched();
      return;
    }
    const formValue = this.campaignForm.value;
    const payload = {
      ...formValue,
      startDate: `${formValue.startDate.year}-${String(formValue.startDate.month).padStart(2, '0')}-${String(formValue.startDate.day).padStart(2, '0')}`,
      endDate: `${formValue.endDate.year}-${String(formValue.endDate.month).padStart(2, '0')}-${String(formValue.endDate.day).padStart(2, '0')}`,
    };
    const operation = this.isEditing
      ? this.campaignService.updateCampaign(this.currentCampaignId!, payload)
      : this.campaignService.createCampaign(payload);
    operation.subscribe({
      next: () => {
        const message = this.isEditing ? 'Campaign updated' : 'Campaign created';
        this.toastr.success(`${message} successfully!`);
        this.resetForm();
      },
      error: (err: HttpErrorResponse) => {
        const errorMessage = err.error?.message || 'An unexpected error occurred.';
        this.toastr.error(errorMessage, 'Operation Failed');
      }
    });
  }

  deleteCampaign(campaign: Campaign): void {
    const modalRef = this.modalService.open(ConfirmationDialogComponent);
    modalRef.componentInstance.title = 'Delete Campaign';
    modalRef.componentInstance.message = `Are you sure you want to delete the "${campaign.name}" campaign? This action cannot be undone.`;

    modalRef.result.then((result) => {
      if (result) {
        this.campaignService.deleteCampaign(campaign.id).subscribe({
          next: () => {
            this.toastr.success(`Campaign "${campaign.name}" was deleted successfully.`, 'Deleted');
            this.loadCampaigns();
          },
          error: (err) => {
            this.toastr.error('Failed to delete campaign.', 'Error');
          }
        });
      }
    }).catch((reason) => {
      console.log(`Dismissed: ${reason}`);
    });
  }

  resetForm(): void {
    this.isEditing = false;
    this.currentCampaignId = null;
    this.submitted = false;
    this.campaignForm.reset();
    this.calculateDisabledDates();
    this.loadCampaigns();
  }

  private fromISOStringToNgbDateStruct(dateString: string): NgbDateStruct | null {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
    } catch (e) {
      return null;
    }
  }

  private fromJSDateToNgbDateStruct(date: Date): NgbDateStruct | null {
    if (!date) return null;
    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
  }

  calculateDisabledDates(excludeId?: number): void {
    this.disabledDates.clear();
    this.campaigns.forEach(campaign => {
      if (campaign.id === excludeId) return;
      const start = parseISO(campaign.startDate);
      const end = parseISO(campaign.endDate);
      for (let dt = start; dt <= end; dt.setDate(dt.getDate() + 1)) {
        this.disabledDates.add(format(dt, 'yyyy-MM-dd'));
      }
    });
  }

  isDateDisabled = (date: NgbDateStruct): boolean => {
    const dateString = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    return this.disabledDates.has(dateString);
  }
}
