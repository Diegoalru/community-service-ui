import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AdminSessionService } from '../../core/services/admin-session.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class  LoginComponent {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  infoMessage: string | null = null;
  isLoading = false;
  private readonly returnUrl: string;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private adminSessionService: AdminSessionService
  ) {
    this.loginForm = this.fb.group({
      usuario: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });

    // Get return URL from route parameters or default to events page
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/events/inscriptions';
  }

  onSubmit(): void {
    this.errorMessage = null;
    this.infoMessage = null;

    if (this.loginForm.invalid) {
      this.errorMessage = 'Verifica que el correo y la contraseña sean válidos.';
      return;
    }

    // Limpiar sesión de administración anterior (por token expirado o usuario diferente)
    this.adminSessionService.clearSession();

    this.isLoading = true;
    const { usuario, password } = this.loginForm.value;

    this.authService.login({ username: usuario, password }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.infoMessage = response.mensaje || 'Inicio de sesión exitoso';
        // Navigate to return URL after successful login
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.mensaje || 'Credenciales inválidas. Por favor, verifica tu correo y contraseña.';
      }
    });
  }

  onForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  onRegister(): void {
    this.router.navigate(['/register']);
  }

  onResendActivation(): void {
    const usuario = this.loginForm.get('usuario')?.value;
    if (!usuario) {
      this.errorMessage = 'Ingresa tu usuario para reenviar la activación.';
      return;
    }

    this.isLoading = true;
    this.authService.resendActivation({ username: usuario }).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.infoMessage = response.mensaje || 'Si el correo está registrado, recibirás un nuevo enlace de activación.';
      },
      error: () => {
        this.isLoading = false;
        this.infoMessage = 'Si el correo está registrado, recibirás un nuevo enlace de activación.';
      }
    });
  }
}
