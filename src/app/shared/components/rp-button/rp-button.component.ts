import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type RpButtonVariant = 'primary' | 'secondary' | 'danger';

@Component({
  selector: 'rp-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rp-button.component.html',
  styleUrls: ['./rp-button.component.scss'],
})
export class RpButtonComponent {
  @Input() variant: RpButtonVariant = 'primary';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' = 'button';
}
