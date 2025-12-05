import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',

})
export class RegisterComponent {
  registerForm!: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(private fb: FormBuilder, private router: Router) {
    this.registerForm = this.fb.group({
      nombre: ['', Validators.required],
      apellidos: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    });
  }

  onSubmit(): void {
    this.errorMessage = null;
    this.successMessage = null;

    if (this.registerForm.invalid) {
      this.errorMessage = 'Debe completar todos los campos correctamente.';
      return;
    }

    const { password, confirmPassword } = this.registerForm.value;

    if (password !== confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    // Aquí luego agregas API real
    console.log('Registro enviado:', this.registerForm.value);

    this.successMessage = 'Usuario registrado exitosamente.';
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
