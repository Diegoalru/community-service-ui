import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-activate',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-auth">
      <div class="activation-wrapper">
        <section class="card">
          <!-- Loading state -->
          <div *ngIf="isLoading" class="activation-status">
            <div class="spinner"></div>
            <h1>Activando cuenta...</h1>
            <p>Por favor espera mientras verificamos tu cuenta.</p>
          </div>

          <!-- Success state -->
          <div *ngIf="!isLoading && isSuccess" class="activation-status success">
            <div class="icon-circle success">✓</div>
            <h1>¡Cuenta activada!</h1>
            <p>{{ message }}</p>
            <a routerLink="/login" class="btn btn-primary">Iniciar sesión</a>
          </div>

          <!-- Error state -->
          <div *ngIf="!isLoading && !isSuccess" class="activation-status error">
            <div class="icon-circle error">✕</div>
            <h1>Error de activación</h1>
            <p>{{ message }}</p>
            <div class="actions">
              <a routerLink="/login" class="btn btn-ghost">Ir a iniciar sesión</a>
              <button (click)="resendActivation()" class="btn btn-primary" *ngIf="canResend">
                Reenviar correo de activación
              </button>
            </div>
          </div>

          <!-- Resend success message -->
          <div *ngIf="resendMessage" class="alert alert-info">
            <div class="bullet">i</div>
            <div>{{ resendMessage }}</div>
          </div>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .activation-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 2rem;
    }
    .card {
      max-width: 500px;
      width: 100%;
      padding: 3rem;
      text-align: center;
    }
    .activation-status h1 {
      margin: 1.5rem 0 0.5rem;
    }
    .activation-status p {
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
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    .alert {
      margin-top: 1.5rem;
      text-align: left;
    }
  `]
})
export class ActivateComponent implements OnInit {
  isLoading = true;
  isSuccess = false;
  message = '';
  canResend = false;
  resendMessage = '';
  private token = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!this.token) {
      this.isLoading = false;
      this.isSuccess = false;
      this.message = 'No se proporcionó un token de activación válido.';
      return;
    }

    this.activateAccount();
  }

  private activateAccount(): void {
    this.authService.activate(this.token).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.isSuccess = true;
        this.message = response.mensaje || 'Tu cuenta ha sido activada exitosamente.';
      },
      error: (error) => {
        this.isLoading = false;
        this.isSuccess = false;
        this.message = error.error?.mensaje || 'El token de activación es inválido o ha expirado.';
        this.canResend = true;
      }
    });
  }

  resendActivation(): void {
    // This would need the user's email - for now just show a message
    this.resendMessage = 'Para reenviar el correo de activación, ingresa tu correo en la página de inicio de sesión.';
  }
}

