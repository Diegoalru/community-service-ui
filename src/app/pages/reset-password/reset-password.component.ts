import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-auth">
      <div class="reset-wrapper">
        <section class="card">
          <!-- No token state -->
          <div *ngIf="!token" class="reset-status error">
            <div class="icon-circle error">✕</div>
            <h1>Enlace inválido</h1>
            <p>No se proporcionó un token de restablecimiento válido.</p>
            <a routerLink="/forgot-password" class="btn btn-primary">Solicitar nuevo enlace</a>
          </div>

          <!-- Success state -->
          <div *ngIf="isSuccess" class="reset-status success">
            <div class="icon-circle success">✓</div>
            <h1>¡Contraseña actualizada!</h1>
            <p>{{ successMessage }}</p>
            <a routerLink="/login" class="btn btn-primary">Iniciar sesión</a>
          </div>

          <!-- Form state -->
          <div *ngIf="token && !isSuccess">
            <h1>Restablecer contraseña</h1>
            <p class="subtitle">Ingresa tu nueva contraseña.</p>

            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label for="password">Nueva contraseña</label>
                <input
                  id="password"
                  type="password"
                  formControlName="password"
                  placeholder="Mínimo 6 caracteres"
                />
                <small *ngIf="form.get('password')?.touched && form.get('password')?.errors?.['required']" class="error-text">
                  La contraseña es requerida
                </small>
                <small *ngIf="form.get('password')?.touched && form.get('password')?.errors?.['minlength']" class="error-text">
                  La contraseña debe tener al menos 6 caracteres
                </small>
              </div>

              <div class="form-group">
                <label for="confirmPassword">Confirmar contraseña</label>
                <input
                  id="confirmPassword"
                  type="password"
                  formControlName="confirmPassword"
                  placeholder="Repite tu contraseña"
                />
                <small *ngIf="form.get('confirmPassword')?.touched && passwordMismatch" class="error-text">
                  Las contraseñas no coinciden
                </small>
              </div>

              <div *ngIf="errorMessage" class="alert alert-error">
                <div class="bullet">!</div>
                <div>{{ errorMessage }}</div>
              </div>

              <div class="actions">
                <button type="submit" class="btn btn-primary" [disabled]="isLoading || form.invalid">
                  {{ isLoading ? 'Guardando...' : 'Restablecer contraseña' }}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .reset-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 2rem;
    }
    .card {
      max-width: 450px;
      width: 100%;
      padding: 2.5rem;
    }
    h1 {
      margin-bottom: 0.5rem;
    }
    .subtitle {
      color: #666;
      margin-bottom: 2rem;
    }
    .form-group {
      margin-bottom: 1.5rem;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }
    .form-group input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }
    .form-group input:focus {
      outline: none;
      border-color: #3498db;
    }
    .error-text {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.25rem;
      display: block;
    }
    .actions {
      margin-top: 1.5rem;
    }
    .actions button {
      width: 100%;
    }
    .reset-status {
      text-align: center;
    }
    .reset-status h1 {
      margin: 1.5rem 0 0.5rem;
    }
    .reset-status p {
      color: #666;
      margin-bottom: 2rem;
    }
    .icon-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      margin: 0 auto;
    }
    .icon-circle.success {
      background: #d4edda;
      color: #155724;
    }
    .icon-circle.error {
      background: #f8d7da;
      color: #721c24;
    }
    .alert {
      padding: 1rem;
      border-radius: 4px;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }
    .alert-error {
      background: #f8d7da;
      color: #721c24;
    }
    .bullet {
      font-weight: bold;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  form: FormGroup;
  token = '';
  isLoading = false;
  isSuccess = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
  }

  get passwordMismatch(): boolean {
    const password = this.form.get('password')?.value;
    const confirmPassword = this.form.get('confirmPassword')?.value;
    return password !== confirmPassword && confirmPassword?.length > 0;
  }

  onSubmit(): void {
    if (this.form.invalid || this.passwordMismatch) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { password } = this.form.value;

    this.authService.resetPassword({
      token: this.token,
      nuevaPassword: password
    }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.isSuccess = true;
        this.successMessage = response.mensaje || 'Tu contraseña ha sido restablecida exitosamente.';
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.mensaje || 'El enlace ha expirado o es inválido. Solicita uno nuevo.';
      }
    });
  }
}

