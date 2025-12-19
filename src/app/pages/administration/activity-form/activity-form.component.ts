import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
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
import { finalize, Subject, takeUntil, Observable } from 'rxjs'; // Import Observable
import { ReferenceDataService } from '../../../core/services/reference-data.service';
import { Pais } from '../../../shared/models/reference-data.dto';

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

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private adminPanelService: AdminPanelService,
    private referenceDataService: ReferenceDataService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.referenceDataService.getPaises().subscribe(p => this.paises = p);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activity'] && this.activity) {
      this.activityForm.patchValue(this.activity);
      // Ajustar fechas a formato datetime-local si es necesario
      if (this.activity.fechaInicio) {
        this.activityForm.get('fechaInicio')?.setValue(this.activity.fechaInicio.substring(0, 16));
      }
      if (this.activity.fechaFin) {
        this.activityForm.get('fechaFin')?.setValue(this.activity.fechaFin.substring(0, 16));
      }
    } else if (changes['activity'] && !this.activity) {
      // Si la actividad se setea a null (creación), resetear el formulario
      this.activityForm.reset({
        horas: 1,
        cupos: 10,
        idCategoria: null, // Resetear categoría también
        nombre: '',
        descripcion: '',
        fechaInicio: '',
        fechaFin: '',
      });
    }
  }

  private initForm(): void {
    this.activityForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(255)]],
      descripcion: ['', Validators.maxLength(1000)],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      horas: [1, [Validators.required, Validators.min(1)]],
      cupos: [10, [Validators.required, Validators.min(1)]],
      idCategoria: [null, Validators.required],
    });
  }

  saveActivity(): void {
    if (this.activityForm.invalid) {
      this.activityForm.markAllAsTouched();
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
          idActividad: this.activity.idActividad, // Include the ID for update
          idOrganizacion: this.idOrganizacion,
          idCategoria: formValue.idCategoria,
          idUbicacion: 0, // Placeholder, el backend creará/gestiorá la ubicación
          nombre: formValue.nombre,
          descripcion: formValue.descripcion || '',
          fechaInicio: formValue.fechaInicio,
          fechaFin: formValue.fechaFin,
          horas: formValue.horas,
          cupos: formValue.cupos,
        },
      };
      saveObservable = this.adminPanelService.actualizarActividad(updateDto);
    } else { // Creating a new activity
      const createDto: ActividadCreacionIntegracionDto = {
        idUsuarioSolicitante,
        actividad: {
          idOrganizacion: this.idOrganizacion,
          idCategoria: formValue.idCategoria,
          idUbicacion: 0, // Placeholder, el backend creará/gestiorá la ubicación
          nombre: formValue.nombre,
          descripcion: formValue.descripcion || '',
          fechaInicio: formValue.fechaInicio,
          fechaFin: formValue.fechaFin,
          horas: formValue.horas,
          cupos: formValue.cupos,
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
