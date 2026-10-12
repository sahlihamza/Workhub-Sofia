import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirmation-dialog',
  templateUrl: './confirmation-dialog.component.html',
})
export class ConfirmationDialogComponent {
  @Input() title: string;
  @Input() message: string;
  @Input() confirmButtonText: string = 'Delete';
  @Input() confirmButtonClass: string = 'btn-danger';

  constructor(public activeModal: NgbActiveModal) {}
}
