import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type RpCardVariant = 'action' | 'list-item';

@Component({
  selector: 'rp-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rp-card.component.html',
  styleUrls: ['./rp-card.component.scss'],
})
export class RpCardComponent {
  @Input() variant: RpCardVariant = 'action';
}
