import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-eligibility-modal',
  templateUrl: './eligibility-modal.component.html',
  styleUrls: ['./eligibility-modal.component.scss'],
})
export class EligibilityModalComponent {

  isEligibleChecked = false

  constructor(public activeModal: NgbActiveModal) {}
}
