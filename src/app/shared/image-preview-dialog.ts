import { Component, inject } from '@angular/core';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-image-preview',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="image-preview-container">
      <button mat-icon-button class="close-btn" mat-dialog-close>
        <mat-icon>close</mat-icon>
      </button>
      <img [src]="data" alt="Vista ampliada">
    </div>
  `,
  styles: [`
    .image-preview-container {
      position: relative;
      background: #000;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      border-radius: 12px;
    }
    .image-preview-container img {
      width: 100%;
      height: auto;
      max-height: 80vh;
      object-fit: contain;
    }
    .close-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      color: white;
      background: rgba(0,0,0,0.5);
    }
  `]
})
export class ImagePreviewDialog {
  data = inject(MAT_DIALOG_DATA);
}
