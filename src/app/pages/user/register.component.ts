import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ReferenceDataService } from '../../core/services/reference-data.service';
import {
  Pais,
  Provincia,
  Canton,
  Distrito,
  TipoCorrespondencia,
  TipoIdentificador,
  Universidad
} from '../../shared/models/reference-data.dto';
import { RegistroCompletoDto, CorrespondenciaRegDto } from '../../shared/models/auth.dto';

// Custom validator for educational email
function educationalEmailValidator(control: AbstractControl): ValidationErrors | null {
  const email = control.value;
  if (!email) return null;
  // Match emails ending with .ac, .cr, .ed or containing these in domain
  const pattern = /^[^\s@]+@[^\s@]+\.(ac|cr|ed|ac\.cr|edu)(\.[a-z]+)?$/i;
  return pattern.test(email) ? null : { educationalEmail: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styles: [`
    .register-wrapper {
      display: flex;
      gap: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    .register-card {
      flex: 2;
      max-width: 700px;
    }
    .side-panel {
      flex: 1;
      min-width: 280px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 1.5rem;
    }

    /* Sections */
    .section {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 1rem;
      overflow: hidden;
    }
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      background: #f8f9fa;
      cursor: pointer;
      user-select: none;
    }
    .section-header:hover {
      background: #e9ecef;
    }
    .section-header h2 {
      margin: 0;
      font-size: 1.1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .toggle-icon {
      font-size: 0.75rem;
      color: #666;
    }
    .section-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }
    .section-badge.required {
      background: #fff3cd;
      color: #856404;
    }
    .section-badge.optional {
      background: #e2e3e5;
      color: #383d41;
    }
    .section-content {
      padding: 1.25rem;
      border-top: 1px solid #e0e0e0;
    }
    .section-description {
      color: #666;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }

    /* Form elements */
    .form-group {
      margin-bottom: 1rem;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.375rem;
      font-weight: 500;
      font-size: 0.9rem;
    }
    .form-group input,
    .form-group select {
      width: 100%;
      padding: 0.625rem 0.75rem;
      border: 1px solid #ced4da;
      border-radius: 4px;
      font-size: 0.95rem;
      transition: border-color 0.15s;
    }
    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #80bdff;
      box-shadow: 0 0 0 2px rgba(0,123,255,0.1);
    }
    .form-group input:disabled,
    .form-group select:disabled {
      background: #e9ecef;
      cursor: not-allowed;
    }
    .form-row {
      display: flex;
      gap: 1rem;
    }
    .form-row .form-group {
      flex: 1;
    }
    .form-row .form-group.flex-2 {
      flex: 2;
    }
    .hint {
      color: #6c757d;
      font-size: 0.8rem;
      margin-top: 0.25rem;
      display: block;
    }
    .error-text {
      color: #dc3545;
      font-size: 0.8rem;
      margin-top: 0.25rem;
      display: block;
    }

    /* Correspondencia adicional */
    .correspondencia-item {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 6px;
      margin-bottom: 0.75rem;
    }
    .correspondencia-item .form-row {
      align-items: flex-end;
      margin-bottom: 0;
    }
    .correspondencia-item .form-group {
      margin-bottom: 0;
    }
    .checkbox-group {
      display: flex;
      align-items: center;
      min-width: 180px;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: normal;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .checkbox-label input[type="checkbox"] {
      width: auto;
    }

    /* Buttons */
    .btn {
      padding: 0.625rem 1.25rem;
      border-radius: 4px;
      font-size: 0.95rem;
      cursor: pointer;
      border: none;
      transition: all 0.15s;
    }
    .btn-primary {
      background: #0d6efd;
      color: white;
    }
    .btn-primary:hover:not(:disabled) {
      background: #0b5ed7;
    }
    .btn-primary:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
    .btn-ghost {
      background: transparent;
      color: #0d6efd;
      border: 1px solid #0d6efd;
    }
    .btn-ghost:hover {
      background: rgba(13,110,253,0.05);
    }
    .btn-small {
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
    }
    .btn-icon {
      padding: 0.5rem 0.75rem;
      min-width: 40px;
    }
    .btn-danger {
      background: #dc3545;
      color: white;
    }
    .btn-danger:hover {
      background: #bb2d3b;
    }

    /* Alerts */
    .alert {
      padding: 1rem;
      border-radius: 6px;
      display: flex;
      gap: 0.75rem;
      margin: 1rem 0;
    }
    .alert-error {
      background: #f8d7da;
      color: #721c24;
    }
    .alert-success {
      background: #d4edda;
      color: #155724;
    }
    .bullet {
      font-weight: bold;
      font-size: 1.1rem;
    }

    /* Actions */
    .actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #e0e0e0;
    }

    /* Responsive */
    @media (max-width: 900px) {
      .register-wrapper {
        flex-direction: column;
      }
      .register-card {
        max-width: 100%;
      }
      .form-row {
        flex-direction: column;
        gap: 0;
      }
      .correspondencia-item .form-row {
        flex-direction: column;
        gap: 0.75rem;
      }
    }
  `]
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  isLoading = false;

  // Section collapse state
  sections = {
    cuenta: true,
    perfil: true,
    ubicacion: true,
    correspondencia: true
  };

  // Reference data
  paises: Pais[] = [];
  provincias: Provincia[] = [];
  cantones: Canton[] = [];
  distritos: Distrito[] = [];
  tiposCorrespondencia: TipoCorrespondencia[] = [];
  tiposCorrespondenciaFiltrados: TipoCorrespondencia[] = []; // Without email type
  tiposIdentificador: TipoIdentificador[] = [];
  universidades: Universidad[] = [];

  // Loading states for cascading selects
  loadingProvincias = false;
  loadingCantones = false;
  loadingDistritos = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private referenceDataService: ReferenceDataService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadReferenceData();
    this.setupLocationCascade();
  }

  private initForm(): void {
    this.registerForm = this.fb.group({
      // Sección Cuenta
      email: ['', [Validators.required, Validators.email, educationalEmailValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],

      // Sección Perfil
      tipoIdentificador: [null, Validators.required],
      identificacion: ['', [Validators.required, Validators.maxLength(50)]],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      apellidoPaterno: ['', [Validators.required, Validators.maxLength(100)]],
      apellidoMaterno: ['', Validators.maxLength(100)],
      fechaNacimiento: ['', Validators.required],
      universidad: [null],
      carrera: ['', Validators.maxLength(100)],

      // Sección Ubicación
      pais: [null, Validators.required],
      provincia: [{ value: null, disabled: true }, Validators.required],
      canton: [{ value: null, disabled: true }, Validators.required],
      distrito: [{ value: null, disabled: true }, Validators.required],
      direccion: ['', Validators.maxLength(200)],
      codigoPostal: ['', Validators.maxLength(20)],

      // Sección Correspondencia Adicional (FormArray)
      correspondenciaAdicional: this.fb.array([])
    });
  }

  private loadReferenceData(): void {
    // Load countries
    this.referenceDataService.getPaises().subscribe({
      next: (data) => this.paises = data,
      error: (err) => console.error('Error loading países:', err)
    });

    // Load ID types
    this.referenceDataService.getTiposIdentificador().subscribe({
      next: (data) => this.tiposIdentificador = data,
      error: (err) => console.error('Error loading tipos identificador:', err)
    });

    // Load correspondence types (filter out email - id=1)
    this.referenceDataService.getTiposCorrespondencia().subscribe({
      next: (data) => {
        this.tiposCorrespondencia = data;
        // Filter out email type for additional correspondence
        this.tiposCorrespondenciaFiltrados = data.filter(t => t.idTipoCorrespondencia !== 1);
      },
      error: (err) => console.error('Error loading tipos correspondencia:', err)
    });

    // Load universities
    this.referenceDataService.getUniversidades().subscribe({
      next: (data) => this.universidades = data,
      error: (err) => console.error('Error loading universidades:', err)
    });
  }

  private setupLocationCascade(): void {
    // When country changes, load provinces
    this.registerForm.get('pais')?.valueChanges.subscribe((idPais) => {
      this.provincias = [];
      this.cantones = [];
      this.distritos = [];
      this.registerForm.get('provincia')?.reset();
      this.registerForm.get('canton')?.reset();
      this.registerForm.get('distrito')?.reset();

      if (idPais) {
        this.registerForm.get('provincia')?.enable();
        this.loadingProvincias = true;
        this.referenceDataService.getProvincias(idPais).subscribe({
          next: (data) => {
            this.provincias = data;
            this.loadingProvincias = false;
          },
          error: () => this.loadingProvincias = false
        });
      } else {
        this.registerForm.get('provincia')?.disable();
      }
      this.registerForm.get('canton')?.disable();
      this.registerForm.get('distrito')?.disable();
    });

    // When province changes, load cantons
    this.registerForm.get('provincia')?.valueChanges.subscribe((idProvincia) => {
      this.cantones = [];
      this.distritos = [];
      this.registerForm.get('canton')?.reset();
      this.registerForm.get('distrito')?.reset();

      const idPais = this.registerForm.get('pais')?.value;
      if (idPais && idProvincia) {
        this.registerForm.get('canton')?.enable();
        this.loadingCantones = true;
        this.referenceDataService.getCantones(idPais, idProvincia).subscribe({
          next: (data) => {
            this.cantones = data;
            this.loadingCantones = false;
          },
          error: () => this.loadingCantones = false
        });
      } else {
        this.registerForm.get('canton')?.disable();
      }
      this.registerForm.get('distrito')?.disable();
    });

    // When canton changes, load districts
    this.registerForm.get('canton')?.valueChanges.subscribe((idCanton) => {
      this.distritos = [];
      this.registerForm.get('distrito')?.reset();

      const idPais = this.registerForm.get('pais')?.value;
      const idProvincia = this.registerForm.get('provincia')?.value;
      if (idPais && idProvincia && idCanton) {
        this.registerForm.get('distrito')?.enable();
        this.loadingDistritos = true;
        this.referenceDataService.getDistritos(idPais, idProvincia, idCanton).subscribe({
          next: (data) => {
            this.distritos = data;
            this.loadingDistritos = false;
          },
          error: () => this.loadingDistritos = false
        });
      } else {
        this.registerForm.get('distrito')?.disable();
      }
    });
  }

  // Correspondencia adicional methods
  get correspondenciaAdicional(): FormArray {
    return this.registerForm.get('correspondenciaAdicional') as FormArray;
  }

  addCorrespondencia(): void {
    const correspondenciaGroup = this.fb.group({
      tipoCorrespondencia: [null, Validators.required],
      valor: ['', [Validators.required, Validators.maxLength(255)]],
      consentimiento: [false]
    });
    this.correspondenciaAdicional.push(correspondenciaGroup);
  }

  removeCorrespondencia(index: number): void {
    this.correspondenciaAdicional.removeAt(index);
  }

  // Section toggle
  toggleSection(section: keyof typeof this.sections): void {
    this.sections[section] = !this.sections[section];
  }

  // Password match validation
  get passwordMismatch(): boolean {
    const password = this.registerForm.get('password')?.value;
    const confirmPassword = this.registerForm.get('confirmPassword')?.value;
    return password !== confirmPassword && confirmPassword?.length > 0;
  }

  onSubmit(): void {
    this.errorMessage = null;
    this.successMessage = null;

    // Check password match
    if (this.passwordMismatch) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    // Mark all fields as touched to show validation errors
    this.registerForm.markAllAsTouched();

    if (this.registerForm.invalid) {
      this.errorMessage = 'Por favor, completa todos los campos requeridos correctamente.';
      // Expand sections with errors
      this.expandSectionsWithErrors();
      return;
    }

    this.isLoading = true;
    const formValue = this.registerForm.getRawValue();

    // Build the DTO
    const dto: RegistroCompletoDto = {
      usuario: {
        username: formValue.email,
        password: formValue.password
      },
      perfil: {
        id_identificador: formValue.tipoIdentificador,
        identificacion: formValue.identificacion,
        nombre: formValue.nombre,
        apellido_p: formValue.apellidoPaterno,
        apellido_m: formValue.apellidoMaterno || null,
        fecha_nacimiento: formValue.fechaNacimiento,
        id_universidad: formValue.universidad || null,
        carrera: formValue.carrera || null
      },
      ubicacion: {
        id_pais: formValue.pais,
        id_provincia: formValue.provincia,
        id_canton: formValue.canton,
        id_distrito: formValue.distrito,
        direccion: formValue.direccion || null,
        codigo_postal: formValue.codigoPostal || null
      },
      correspondencia: this.buildCorrespondenciaArray(formValue)
    };

    this.authService.register(dto).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.mensaje || 'Usuario registrado exitosamente. Revisa tu correo para activar tu cuenta.';
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.mensaje || 'No se pudo crear la cuenta. Por favor, intenta nuevamente.';
      }
    });
  }

  private buildCorrespondenciaArray(formValue: any): CorrespondenciaRegDto[] {
    const correspondencia: CorrespondenciaRegDto[] = [];

    // Add primary email (required)
    correspondencia.push({
      id_tipo_correspondencia: 1, // Email type
      valor: formValue.email,
      consentimiento: 'S'
    });

    // Add additional correspondence
    formValue.correspondenciaAdicional.forEach((item: any) => {
      if (item.tipoCorrespondencia && item.valor) {
        correspondencia.push({
          id_tipo_correspondencia: item.tipoCorrespondencia,
          valor: item.valor,
          consentimiento: item.consentimiento ? 'S' : 'N'
        });
      }
    });

    return correspondencia;
  }

  private expandSectionsWithErrors(): void {
    const controls = this.registerForm.controls;

    // Check cuenta section
    if (controls['email']?.invalid || controls['password']?.invalid || controls['confirmPassword']?.invalid) {
      this.sections.cuenta = true;
    }

    // Check perfil section
    if (controls['tipoIdentificador']?.invalid || controls['identificacion']?.invalid ||
        controls['nombre']?.invalid || controls['apellidoPaterno']?.invalid ||
        controls['fechaNacimiento']?.invalid) {
      this.sections.perfil = true;
    }

    // Check ubicacion section
    if (controls['pais']?.invalid || controls['provincia']?.invalid ||
        controls['canton']?.invalid || controls['distrito']?.invalid) {
      this.sections.ubicacion = true;
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
