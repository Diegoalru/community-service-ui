import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-administration',
  standalone: true,
  templateUrl: './administration.html',
  styleUrls: ['./administration.css'],
})
export class AdministrationComponent {
  isModalOpen = false;
  modalTitle = 'Confirmación';
  modalMessage = 'Inscripción exitosa.';
    // Tabla / acciones
  private savingIds = new Set<number>();






   openModal(title: string, message: string): void {
    this.modalTitle = title;
    this.modalMessage = message;
    this.isModalOpen = true;
  }

 

   closeModal(): void {
    this.isModalOpen = false;
  }

}
