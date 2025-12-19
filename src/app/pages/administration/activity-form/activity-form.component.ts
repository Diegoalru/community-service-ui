import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  ActividadRow,
  CategoriaActividad,
  ActividadCreacionIntegracionDto,
  ActividadActualizacionIntegracionDto, // Import the new DTO
  ApiMensajeAdmin, // Import ApiMensajeAdmin
} from '../../../shared/models/admin-panel.dto';
import { AuthService } from '../../../core/services/auth.service';
import { AdminPanelService } from '../../../core/services/admin-panel.service';
import { ReferenceDataService } from '../../../core/services/reference-data.service';
import { finalize, Subject, takeUntil, Observable } from 'rxjs'; // Import Observable
import { Pais, Provincia, Canton, Distrito } from '../../../shared/models/reference-data.dto';

@Component({
  selector: 'app-activity-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './activity-form.component.html',
})
export class ActivityFormComponent implements OnInit, OnChanges {
  @Input() idOrganizacion!: number;
  @Input() activity: ActividadRow | null = null;
  @Input() categorias: CategoriaActividad[] = [];
  @Output() formSubmitted = new EventEmitter<void>();
  @Output() formCanceled = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  activityForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;

  // Ubicación
  paises: Pais[] = [];
  provincias: Provincia[] = [];
  cantones: Canton[] = [];
  distritos: Distrito[] = [];

  // Loading states for cascading selects
  loadingProvincias = false;
  loadingCantones = false;
  loadingDistritos = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private adminPanelService: AdminPanelService,
    private referenceDataService: ReferenceDataService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.activityForm) {
      this.initForm();
    }
    this.referenceDataService.getPaises().subscribe((p: Pais[]) => this.paises = p);
    this.setupLocationCascade();
    this.cdr.detectChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.activityForm) {
      this.initForm();
    }
    if (changes['activity'] && this.activity) {
      // Logic for editing
      const act = this.activity as any;
      this.activityForm.patchValue({
        nombre: this.activity.nombre,
        descripcion: this.activity.descripcion,
        horas: this.activity.horas,
        cupos: this.activity.cupos,
        idCategoria: Number(act.idCategoria || act.id_categoria),
      });

      // Patch dates
      if (this.activity.fechaInicio) {
        this.activityForm.get('fechaInicio')?.setValue(this.activity.fechaInicio.substring(0, 16));
      }
      if (this.activity.fechaFin) {
        this.activityForm.get('fechaFin')?.setValue(this.activity.fechaFin.substring(0, 16));
      }

      // Patch location if available in the activity object
      if (act.ubicacion) {
        this.activityForm.patchValue({
          idPais: act.ubicacion.idPais || act.ubicacion.id_pais,
          idProvincia: act.ubicacion.idProvincia || act.ubicacion.id_provincia,
          idCanton: act.ubicacion.idCanton || act.ubicacion.id_canton,
          idDistrito: act.ubicacion.idDistrito || act.ubicacion.id_distrito,
          direccion: act.ubicacion.direccion,
          codigoPostal: act.ubicacion.codigoPostal || act.ubicacion.codigo_postal,
        });
      }

    } else if (changes['activity'] && !this.activity) {
      // Creating a new activity
      if (this.activityForm) {
        this.activityForm.reset({
          horas: 1,
          cupos: 10,
          idCategoria: null,
          nombre: '',
          descripcion: '',
          fechaInicio: '',
          fechaFin: '',
          idPais: null,
          idProvincia: null,
          idCanton: null,
          idDistrito: null,
          direccion: '',
        });
        // Ensure location fields are disabled initially
        this.activityForm.get('idProvincia')?.disable();
        this.activityForm.get('idCanton')?.disable();
        this.activityForm.get('idDistrito')?.disable();
      }
    }
    this.cdr.detectChanges();
  }

  private initForm(): void {
    this.activityForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(255)]],
      descripcion: ['', Validators.maxLength(1000)],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      horas: [1, [Validators.required, Validators.min(1)]],
      cupos: [10, [Validators.required, Validators.min(1)]],
      // Ubicación
      idPais: [null, Validators.required],
      idProvincia: [{ value: null, disabled: true }, Validators.required],
      idCanton: [{ value: null, disabled: true }, Validators.required],
      idDistrito: [{ value: null, disabled: true }, Validators.required],
      direccion: ['', Validators.maxLength(200)],
      codigoPostal: ['', Validators.maxLength(20)],
    });
  }

  private setupLocationCascade(): void {
    // País -> Provincias
    this.activityForm.get('idPais')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((idPais) => {
      this.provincias = [];
      this.cantones = [];
      this.distritos = [];

      this.activityForm.get('idProvincia')?.reset(null, { emitEvent: false });
      this.activityForm.get('idCanton')?.reset(null, { emitEvent: false });
      this.activityForm.get('idDistrito')?.reset(null, { emitEvent: false });
      this.activityForm.get('idCanton')?.disable();
      this.activityForm.get('idDistrito')?.disable();

      if (idPais) {
        this.activityForm.get('idProvincia')?.enable();
        this.loadingProvincias = true;
        this.referenceDataService.getProvincias(idPais).subscribe({
          next: (data: Provincia[]) => {
            this.provincias = data;
            this.loadingProvincias = false;
            // If editing and we already have a value, it will be patched by ngOnChanges or during initialization
            this.cdr.detectChanges();
          },
          error: () => { this.loadingProvincias = false; }
        });
      } else {
        this.activityForm.get('idProvincia')?.disable();
      }
    });

    // Provincia -> Cantones
    this.activityForm.get('idProvincia')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((idProvincia) => {
      const idPais = this.activityForm.get('idPais')?.value;
      this.cantones = [];
      this.distritos = [];
      this.activityForm.get('idCanton')?.reset(null, { emitEvent: false });
      this.activityForm.get('idDistrito')?.reset(null, { emitEvent: false });

      if (idPais && idProvincia) {
        this.activityForm.get('idCanton')?.enable();
        this.loadingCantones = true;
        this.referenceDataService.getCantones(idPais, idProvincia).subscribe({
          next: (data: Canton[]) => {
            this.cantones = data;
            this.loadingCantones = false;
            this.cdr.detectChanges();
          },
          error: () => { this.loadingCantones = false; }
        });
      } else {
        this.activityForm.get('idCanton')?.disable();
      }
      this.activityForm.get('idDistrito')?.disable();
    });

    // Cantón -> Distritos
    this.activityForm.get('idCanton')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((idCanton) => {
      const idPais = this.activityForm.get('idPais')?.value;
      const idProvincia = this.activityForm.get('idProvincia')?.value;
      this.distritos = [];
      this.activityForm.get('idDistrito')?.reset(null, { emitEvent: false });

      if (idPais && idProvincia && idCanton) {
        this.activityForm.get('idDistrito')?.enable();
        this.loadingDistritos = true;
        this.referenceDataService.getDistritos(idPais, idProvincia, idCanton).subscribe({
          next: (data: Distrito[]) => {
            this.distritos = data;
            this.loadingDistritos = false;
            this.cdr.detectChanges();
          },
          error: () => { this.loadingDistritos = false; }
        });
      } else {
        this.activityForm.get('idDistrito')?.disable();
      }
    });

    // Categoría -> Convertir a número si cambia
    this.activityForm.get('idCategoria')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
      if (val !== null && typeof val === 'string') {
        const numVal = parseInt(val, 10);
        if (!isNaN(numVal)) {
          this.activityForm.get('idCategoria')?.patchValue(numVal, { emitEvent: false });
        }
      }
    });

    // Distrito -> Código Postal (automático)
    this.activityForm.get('idDistrito')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((idDistrito: number | null) => {
      if (idDistrito) {
        this.referenceDataService.getCodigoPostal(idDistrito).subscribe({
          next: (data: { codigo: string }) => {
            this.activityForm.get('codigoPostal')?.setValue(data.codigo, { emitEvent: false });
          },
          error: (err: any) => console.error('Error loading código postal:', err)
        });
      } else {
        this.activityForm.get('codigoPostal')?.setValue('', { emitEvent: false });
      }
    });
  }

  saveActivity(): void {
    if (this.activityForm.invalid) {
      this.activityForm.markAllAsTouched();

      // Encontrar campos inválidos para depuración o feedback más específico
      const invalidFields = [];
      const controls = this.activityForm.controls;
      for (const name in controls) {
          if (controls[name].invalid) {
              invalidFields.push(name);
          }
      }
      console.log('Campos inválidos:', invalidFields);

      this.errorMessage = 'Por favor, completa todos los campos requeridos marcados en rojo.';
      return;
    }

    const idUsuarioSolicitante = this.authService.getUserId();
    if (!idUsuarioSolicitante) {
        this.errorMessage = 'No se pudo obtener la identidad del usuario.';
        return;
    };

    const formValue = this.activityForm.getRawValue();

    let saveObservable: Observable<ApiMensajeAdmin>;

    if (this.activity) { // Editing an existing activity
      const updateDto: ActividadActualizacionIntegracionDto = {
        idUsuarioSolicitante,
        actividad: {
          idActividad: this.activity.idActividad,
          idOrganizacion: this.idOrganizacion,
          idCategoria: 4,
          ubicacion: {
            idPais: Number(formValue.idPais),
            idProvincia: Number(formValue.idProvincia),
            idCanton: Number(formValue.idCanton),
            idDistrito: Number(formValue.idDistrito),
            direccion: formValue.direccion || '',
            codigoPostal: formValue.codigoPostal || '',
            latitud: 0,
            longitud: 0
          },
          nombre: formValue.nombre,
          descripcion: formValue.descripcion || '',
          fechaInicio: formValue.fechaInicio,
          fechaFin: formValue.fechaFin,
          horas: formValue.horas,
          cupos: formValue.cupos,
        }
      };
      saveObservable = this.adminPanelService.actualizarActividad(updateDto);
    } else { // Creating a new activity
      const createDto: ActividadCreacionIntegracionDto = {
        idUsuarioSolicitante,
        actividad: {
          idOrganizacion: this.idOrganizacion,
          idCategoria: 4,
          nombre: formValue.nombre,
          descripcion: formValue.descripcion || '',
          fechaInicio: formValue.fechaInicio,
          fechaFin: formValue.fechaFin,
          horas: formValue.horas,
          cupos: formValue.cupos,
          ubicacion: {
            idPais: Number(formValue.idPais),
            idProvincia: Number(formValue.idProvincia),
            idCanton: Number(formValue.idCanton),
            idDistrito: Number(formValue.idDistrito),
            direccion: formValue.direccion || '',
            codigoPostal: formValue.codigoPostal || '',
            latitud: 0,
            longitud: 0
          }
        },
      };
      saveObservable = this.adminPanelService.crearActividad(createDto);
    }

    this.isLoading = true;
    this.errorMessage = null;

    saveObservable
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe({
        next: () => {
          this.formSubmitted.emit();
        },
        error: (err: any) => {
          this.errorMessage = err.error?.mensaje || 'Ocurrió un error al guardar la actividad.';
        },
      });
  }

  cancel(): void {
    this.formCanceled.emit();
  }
}
