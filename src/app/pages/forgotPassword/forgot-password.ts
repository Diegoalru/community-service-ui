// src/app/forgot-password.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './forgot-password.html',   // vamos a crear este HTML
})
export class ForgotPasswordComponent {
  form: FormGroup;
  message: string | null = null;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const { email } = this.form.value;
    console.log('Recuperar contraseña para:', email);

    this.message =
      'Si el correo está registrado, recibirás un mensaje con instrucciones para recuperar tu contraseña.';
  }
}
