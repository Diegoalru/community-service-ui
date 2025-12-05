import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';


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

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  onSubmit(): void {
    this.errorMessage = null;
    this.infoMessage = null;

    if (this.loginForm.invalid) {
      this.errorMessage = 'Verifica que el correo y la contraseña sean válidos.';
      return;
    }

    const { email, password } = this.loginForm.value;

    // TODO: aquí llamas a tu AuthService / API
    // this.authService.login(email, password).subscribe(...)
    console.log('Login con:', email, password);
  }

  onForgotPassword(): void {
    // TODO: redirigir a /auth/forgot-password o abrir modal
    console.log('Ir a recuperar contraseña');
  }

  onRegister(): void {
    // TODO: redirigir a /auth/register
    console.log('Ir a registro de usuario');
  }
}
