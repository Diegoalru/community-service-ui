import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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

      <!-- Modal de éxito -->
      <div *ngIf="showSuccessModal" class="modal-overlay" (click)="closeSuccessModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-icon success">
            ✓
          </div>
          <h2>¡Contraseña actualizada!</h2>
          <p class="modal-message">{{ successMessage }}</p>
          <p class="modal-instruction">
            Ya puedes iniciar sesión con tu nueva contraseña.
          </p>
          <div class="modal-actions">
            <button class="btn btn-primary" (click)="goToLogin()">
              Iniciar sesión
            </button>
            <button class="btn btn-ghost" (click)="closeSuccessModal()">
              Ir a inicio
            </button>
          </div>
        </div>
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
    /* Modal */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      animation: fadeIn 0.3s ease;
    }
    .modal-content {
      background: white;
      padding: 2.5rem;
      border-radius: 12px;
      max-width: 500px;
      width: 90%;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      animation: slideUp 0.3s ease;
    }
    .modal-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      margin: 0 auto 1.5rem;
      font-weight: bold;
    }
    .modal-icon.success {
      background: #d4edda;
      color: #155724;
    }
    .modal-content h2 {
      margin: 0 0 1rem;
      color: #155724;
    }
    .modal-message {
      color: #666;
      margin-bottom: 1rem;
      font-size: 1rem;
    }
    .modal-instruction {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 6px;
      color: #495057;
      margin-bottom: 1.5rem;
      font-size: 0.95rem;
      line-height: 1.5;
    }
    .modal-actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .modal-actions .btn {
      min-width: 150px;
    }
    @keyframes fadeIn {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
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
  showSuccessModal = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
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
        this.successMessage = response.mensaje || 'Tu contraseña ha sido restablecida exitosamente.';

        // Show success modal instead of an inline message
        this.showSuccessModal = true;

        // Force change detection
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.mensaje || 'El enlace ha expirado o es inválido. Solicita uno nuevo.';

        // Force change detection
        this.cdr.detectChanges();
      }
    });
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
    // Redirect to home page
    this.router.navigate(['/']);
  }

  goToLogin(): void {
    this.showSuccessModal = false;
    // Redirect to login page
    this.router.navigate(['/login']);
  }
}

