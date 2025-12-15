// src/app/forgot-password.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
})
export class ForgotPasswordComponent {
  form: FormGroup;
  message: string | null = null;
  errorMessage: string | null = null;
  isLoading = false;
  isSubmitted = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;
    const { username } = this.form.value;

    this.authService.requestRecovery({ username }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.isSubmitted = true;
        this.message = response.mensaje || 'Si el usuario está registrado, recibirás un mensaje con instrucciones para recuperar tu contraseña.';
      },
      error: () => {
        // Always show a generic message for security (don't reveal if the user exists)
        this.isLoading = false;
        this.isSubmitted = true;
        this.message = 'Si el usuario está registrado, recibirás un mensaje con instrucciones para recuperar tu contraseña.';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
