import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
          <!-- Loading state with spinner that transforms to check/X -->
          <div class="activation-status">
            <!-- Animated icon container -->
            <div class="icon-container">
              <div *ngIf="isLoading" class="spinner"></div>
              <div *ngIf="!isLoading && isSuccess" class="icon-circle success animate-in">✓</div>
              <div *ngIf="!isLoading && !isSuccess" class="icon-circle error animate-in">✕</div>
            </div>

            <!-- Loading text -->
            <div *ngIf="isLoading">
              <h1>Activando cuenta...</h1>
              <p>Por favor espera mientras verificamos tu cuenta.</p>
            </div>

            <!-- Success state -->
            <div *ngIf="!isLoading && isSuccess">
              <h1>¡Cuenta activada!</h1>
              <p>{{ message }}</p>
              <div class="actions">
                <a routerLink="/login" class="btn btn-primary">Iniciar sesión</a>
                <a routerLink="/" class="btn btn-ghost">Ir a inicio</a>
              </div>
            </div>

            <!-- Error state -->
            <div *ngIf="!isLoading && !isSuccess">
              <h1>Error de activación</h1>
              <p>{{ message }}</p>
              <div class="actions">
                <a routerLink="/login" class="btn btn-primary">Iniciar sesión</a>
                <a routerLink="/" class="btn btn-ghost">Ir a inicio</a>
              </div>
            </div>

            <!-- Resend success message -->
            <div *ngIf="resendMessage" class="alert alert-info">
              <div class="bullet">i</div>
              <div>{{ resendMessage }}</div>
            </div>
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
    .icon-container {
      min-height: 80px;
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 1rem;
    }
    .icon-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      font-weight: bold;
    }
    .icon-circle.success {
      background: #d4edda;
      color: #155724;
    }
    .icon-circle.error {
      background: #f8d7da;
      color: #721c24;
    }
    .icon-circle.animate-in {
      animation: scaleIn 0.4s ease-out;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes scaleIn {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 1.5rem;
    }
    .btn {
      padding: 0.625rem 1.5rem;
      border-radius: 4px;
      font-size: 0.95rem;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      transition: all 0.15s;
      border: none;
    }
    .btn-primary {
      background: #0d6efd;
      color: white;
    }
    .btn-primary:hover {
      background: #0b5ed7;
    }
    .btn-ghost {
      background: transparent;
      color: #0d6efd;
      border: 1px solid #0d6efd;
    }
    .btn-ghost:hover {
      background: rgba(13,110,253,0.05);
    }
    .alert {
      margin-top: 1.5rem;
      text-align: left;
      padding: 1rem;
      border-radius: 6px;
      background: #d1ecf1;
      color: #0c5460;
      display: flex;
      gap: 0.75rem;
    }
    .bullet {
      font-weight: bold;
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
    private authService: AuthService,
    private cdr: ChangeDetectorRef
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
    console.log('Intentando activar cuenta con token:', this.token);

    this.authService.activate(this.token).subscribe({
      next: (response) => {
        console.log('Activación exitosa:', response);
        this.isLoading = false;
        this.isSuccess = true;
        this.message = response.mensaje || 'Tu cuenta ha sido activada exitosamente.';
        // Force change detection
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error en activación:', error);
        console.error('Error status:', error.status);
        console.error('Error body:', error.error);

        this.isLoading = false;
        this.isSuccess = false;

        // Extract error message from different possible structures
        if (error.error?.mensaje) {
          this.message = error.error.mensaje;
        } else if (error.error?.message) {
          this.message = error.error.message;
        } else if (typeof error.error === 'string') {
          this.message = error.error;
        } else if (error.message) {
          this.message = error.message;
        } else {
          this.message = 'El token de activación es inválido o ha expirado.';
        }

        this.canResend = true;

        // Force change detection
        this.cdr.detectChanges();
      },
      complete: () => {
        console.log('Proceso de activación completado');
      }
    });
  }

  resendActivation(): void {
    // This would need the user's email - for now just show a message
    this.resendMessage = 'Para reenviar el correo de activación, ingresa tu correo en la página de inicio de sesión.';
  }
}

