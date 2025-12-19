import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize, catchError, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

import { AdminPanelService } from '../../core/services/admin-panel.service';
import { AdminSessionService } from '../../core/services/admin-session.service';
import { AuthService } from '../../core/services/auth.service';
import { ReferenceDataService } from '../../core/services/reference-data.service';
import {
  UsuarioDeOrganizacion,
  ActividadRow,
  HorarioRow,
  CategoriaActividad,
  HorarioActividadCreateDto,
  ActividadCreacionIntegracionDto,
  ActualizarOrganizacionDto,
} from '../../shared/models/admin-panel.dto';
import { Pais, Provincia, Canton, Distrito, Universidad } from '../../shared/models/reference-data.dto';

@Component({
  selector: 'app-administration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './administration.html',
  styleUrls: ['./administration.css'],
})
export class AdministrationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Estado de secciones colapsables
  sections = {
    configuracion: true,
    miembros: false,
    actividades: false,
    horarios: false,
  };

  // Estado de carga
  isLoading = false;
  loadError: string | null = null;
  successMessage: string | null = null;

  // ID de organización desde la ruta
  idOrganizacion: number = 0;
  nombreOrganizacion: string = '';

  // --- Datos de Configuración ---
  organizacionForm!: FormGroup;
  universidades: Universidad[] = [];

  // --- Datos de Miembros ---
  usuarios: UsuarioDeOrganizacion[] = [];
  usuarioSeleccionado: UsuarioDeOrganizacion | null = null;
  rolesDisponibles = [
    { id: 1, nombre: 'Administrador' },
    { id: 2, nombre: 'Coordinador' },
    { id: 3, nombre: 'Supervisor' },
    { id: 4, nombre: 'Voluntario' },
  ];

  // --- Datos de Actividades ---
  actividades: ActividadRow[] = [];
  categorias: CategoriaActividad[] = [];
  actividadForm!: FormGroup;

  // Ubicación en cascada
  paises: Pais[] = [];
  provincias: Provincia[] = [];
  cantones: Canton[] = [];
  distritos: Distrito[] = [];
  loadingProvincias = false;
  loadingCantones = false;
  loadingDistritos = false;

  // --- Datos de Horarios ---
  actividadSeleccionadaHorario: number | null = null;
  horarios: HorarioRow[] = [];
  horarioForm!: FormGroup;

  // Modal de confirmación
  isModalOpen = false;
  modalTitle = '';
  modalMessage = '';
  modalAction: (() => void) | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private adminPanelService: AdminPanelService,
    private adminSessionService: AdminSessionService,
    private authService: AuthService,
    private referenceDataService: ReferenceDataService
  ) {}

  ngOnInit(): void {
    // Inicializar formularios primero
    this.initForms();

    // Obtener ID de organización de la ruta
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          const idParam = params.get('idOrg');
          if (idParam) {
            this.idOrganizacion = parseInt(idParam, 10);
            this.nombreOrganizacion = this.adminSessionService.organizacionActual?.nombre || 'Organización';
            return of(this.idOrganizacion);
          }
          this.router.navigate(['/organizations']); // Redirigir si no hay ID
          return of(null);
        })
      )
      .subscribe((idOrg) => {
        if (idOrg) {
          this.loadInitialData();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ============================================================================
  // Inicialización
  // ============================================================================

  private initForms(): void {
    // Formulario de configuración de la organización
    this.organizacionForm = this.fb.group({
      organizacion: this.fb.group({
        idOrganizacion: [null],
        nombre: ['', [Validators.required, Validators.maxLength(255)]],
        descripcion: ['', Validators.maxLength(4000)],
        idUniversidad: [null, Validators.required],
      }),
      ubicacion: this.fb.group({
        idUbicacion: [null],
        idPais: [null, Validators.required],
        idProvincia: [{ value: null, disabled: true }, Validators.required],
        idCanton: [{ value: null, disabled: true }, Validators.required],
        idDistrito: [{ value: null, disabled: true }, Validators.required],
        direccion: ['', Validators.maxLength(200)],
      }),
    });

    // Formulario de actividad
    this.actividadForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(255)]],
      descripcion: ['', Validators.maxLength(1000)],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      horas: [1, [Validators.required, Validators.min(1)]],
      cupos: [10, [Validators.required, Validators.min(1)]],
      idCategoria: [null, Validators.required],
    });

    // Formulario de horario
    this.horarioForm = this.fb.group({
      fecha: ['', Validators.required],
      horaInicio: ['', Validators.required],
      horaFin: ['', Validators.required],
      descripcion: [''],
    });

    this.setupLocationCascade(this.organizacionForm);
  }

  private loadInitialData(): void {
    this.isLoading = true;
    this.loadError = null;

    forkJoin({
      organizacion: this.adminPanelService.getOrganizacionById({ id: this.idOrganizacion }),
      usuarios: this.adminPanelService.getUsuariosPorOrg({ idOrganizacion: this.idOrganizacion }).pipe(catchError(() => of([] as UsuarioDeOrganizacion[]))),
      actividades: this.adminPanelService.getActividadesPorOrg({ idOrganizacion: this.idOrganizacion }).pipe(catchError(() => of([] as ActividadRow[]))),
      categorias: this.adminPanelService.getCategoriasActividad().pipe(catchError(() => of([] as CategoriaActividad[]))),
      paises: this.referenceDataService.getPaises().pipe(catchError(() => of([] as Pais[]))),
      universidades: this.referenceDataService.getUniversidades().pipe(catchError(() => of([] as Universidad[]))),
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (data) => {
          this.usuarios = data.usuarios;
          this.actividades = data.actividades;
          this.categorias = data.categorias;
          this.paises = data.paises;
          this.universidades = data.universidades;

          if (data.organizacion) {
            this.organizacionForm.patchValue(data.organizacion);
            this.nombreOrganizacion = data.organizacion.nombre;
            // Disparar la carga de la cascada de ubicación
            if (data.organizacion.ubicacion?.idPais) {
              this.organizacionForm.get('ubicacion.idPais')?.updateValueAndValidity({ emitEvent: true });
            }
          }
        },
        error: () => {
          this.loadError = 'Error al cargar los datos. Intenta nuevamente.';
        },
      });
  }

  // ============================================================================
  // Secciones colapsables
  // ============================================================================

  toggleSection(section: 'configuracion' | 'miembros' | 'actividades' | 'horarios'): void {
    this.sections[section] = !this.sections[section];
  }

  // ============================================================================
  // Configuración
  // ============================================================================

  guardarConfiguracion(): void {
    if (this.organizacionForm.invalid) {
      this.organizacionForm.markAllAsTouched();
      return;
    }

    const idUsuarioSolicitante = this.authService.getUserId();
    if (!idUsuarioSolicitante) {
      this.showError('No se pudo verificar la identidad del usuario.');
      return;
    }

    const formValue = this.organizacionForm.getRawValue();
    const dto: ActualizarOrganizacionDto = {
      idUsuarioSolicitante,
      organizacion: formValue.organizacion,
      ubicacion: formValue.ubicacion,
    };

    this.isLoading = true;
    this.adminPanelService.actualizarOrganizacion(dto)
      .pipe(takeUntil(this.destroy$), finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.showSuccess('Organización actualizada correctamente.');
          // Actualizar el nombre en la cabecera
          this.nombreOrganizacion = dto.organizacion.nombre;
          this.adminSessionService.setOrganizacionActual({
            ...this.adminSessionService.organizacionActual!,
            nombre: dto.organizacion.nombre
          });
        },
        error: (err) => this.showError(err.error?.mensaje || 'Error al guardar los cambios.'),
      });
  }

  // ============================================================================
  // Miembros
  // ============================================================================

  seleccionarUsuario(usuario: UsuarioDeOrganizacion): void {
    this.usuarioSeleccionado = usuario;
  }

  cambiarRolUsuario(usuario: UsuarioDeOrganizacion, nuevoRolId: number): void {
    if (usuario.idRol === nuevoRolId) return;

    const idUsuarioSolicitante = this.authService.getUserId();
    if (!idUsuarioSolicitante) return;

    this.adminPanelService
      .cambiarRolUsuario({
        idUsuarioSolicitante,
        idRolUsuarioOrganizacion: usuario.idRolUsuarioOrganizacion,
        idNuevoRol: nuevoRolId,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Rol actualizado correctamente');
          this.recargarUsuarios();
        },
        error: (err) => {
          this.showError(err.error?.mensaje || 'Error al cambiar el rol');
        },
      });
  }

  confirmarEliminarUsuario(usuario: UsuarioDeOrganizacion): void {
    this.openConfirmModal(
      'Eliminar usuario',
      `¿Estás seguro de que deseas eliminar a ${usuario.nombre || usuario.username} de la organización?`,
      () => this.eliminarUsuario(usuario)
    );
  }

  private eliminarUsuario(usuario: UsuarioDeOrganizacion): void {
    const idUsuarioSolicitante = this.authService.getUserId();
    if (!idUsuarioSolicitante) return;

    this.adminPanelService
      .eliminarUsuarioOrg({
        idUsuarioSolicitante,
        idRolUsuarioOrganizacion: usuario.idRolUsuarioOrganizacion,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Usuario eliminado correctamente');
          this.recargarUsuarios();
          if (this.usuarioSeleccionado?.idUsuario === usuario.idUsuario) {
            this.usuarioSeleccionado = null;
          }
        },
        error: (err) => {
          this.showError(err.error?.mensaje || 'Error al eliminar el usuario');
        },
      });
  }

  private recargarUsuarios(): void {
    this.adminPanelService
      .getUsuariosPorOrg({ idOrganizacion: this.idOrganizacion })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuarios) => {
          this.usuarios = usuarios;
          this.cdr.detectChanges();
        },
      });
  }

  // ============================================================================
  // Actividades
  // ============================================================================

  crearActividad(): void {
    if (this.actividadForm.invalid) {
      this.actividadForm.markAllAsTouched();
      return;
    }

    const idUsuarioSolicitante = this.authService.getUserId();
    if (!idUsuarioSolicitante) return;

    const formValue = this.actividadForm.getRawValue();

    // Construir DTO
    const dto: ActividadCreacionIntegracionDto = {
      idUsuarioSolicitante,
      actividad: {
        idOrganizacion: this.idOrganizacion,
        idCategoria: formValue.idCategoria,
        idUbicacion: 0, // El backend lo resolverá
        nombre: formValue.nombre,
        descripcion: formValue.descripcion || '',
        fechaInicio: formValue.fechaInicio,
        fechaFin: formValue.fechaFin,
        horas: formValue.horas,
        cupos: formValue.cupos,
      },
    };

    this.isLoading = true;
    this.adminPanelService
      .crearActividad(dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.showSuccess('Actividad creada correctamente');
          this.actividadForm.reset({
            horas: 1,
            cupos: 10,
          });
          this.recargarActividades();
        },
        error: (err) => {
          this.showError(err.error?.mensaje || 'Error al crear la actividad');
        },
      });
  }

  confirmarEliminarActividad(actividad: ActividadRow): void {
    this.openConfirmModal(
      'Eliminar actividad',
      `¿Estás seguro de que deseas eliminar la actividad "${actividad.nombre}"? También se eliminarán sus horarios asociados.`,
      () => this.eliminarActividad(actividad)
    );
  }

  private eliminarActividad(actividad: ActividadRow): void {
    const idUsuarioSolicitante = this.authService.getUserId();
    if (!idUsuarioSolicitante) return;

    this.adminPanelService
      .eliminarActividad({
        idUsuarioSolicitante,
        idActividad: actividad.idActividad,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Actividad eliminada correctamente');
          this.recargarActividades();
        },
        error: (err) => {
          this.showError(err.error?.mensaje || 'Error al eliminar la actividad');
        },
      });
  }

  private recargarActividades(): void {
    this.adminPanelService
      .getActividadesPorOrg({ idOrganizacion: this.idOrganizacion })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (actividades) => {
          this.actividades = actividades;
          this.cdr.detectChanges();
        },
      });
  }

  // ============================================================================
  // Horarios
  // ============================================================================

  onActividadHorarioChange(idActividad: number): void {
    this.actividadSeleccionadaHorario = idActividad;
    this.cargarHorarios(idActividad);
  }

  private cargarHorarios(idActividad: number): void {
    this.adminPanelService
      .getHorariosPorActividad({ idActividad })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (horarios) => {
          this.horarios = horarios;
          this.cdr.detectChanges();
        },
        error: () => {
          this.horarios = [];
        },
      });
  }

  agregarHorario(): void {
    if (this.horarioForm.invalid || !this.actividadSeleccionadaHorario) {
      this.horarioForm.markAllAsTouched();
      return;
    }

    const idUsuario = this.authService.getUserId();
    if (!idUsuario) return;

    const formValue = this.horarioForm.value;

    // Construir fechas completas
    const fechaBase = formValue.fecha;
    const horaInicio = `${fechaBase}T${formValue.horaInicio}:00`;
    const horaFin = `${fechaBase}T${formValue.horaFin}:00`;

    const dto: HorarioActividadCreateDto = {
      idOrganizacion: this.idOrganizacion,
      idActividad: this.actividadSeleccionadaHorario,
      idUsuario,
      fecha: `${fechaBase}T00:00:00`,
      horaInicio,
      horaFin,
      descripcion: formValue.descripcion || undefined,
      situacion: 'I', // Inicial
      estado: 'A', // Activo
    };

    this.isLoading = true;
    this.adminPanelService
      .crearHorario(dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.showSuccess('Horario agregado correctamente');
          this.horarioForm.reset();
          this.cargarHorarios(this.actividadSeleccionadaHorario!);
        },
        error: (err) => {
          this.showError(err.error?.mensaje || 'Error al agregar el horario');
        },
      });
  }

  confirmarEliminarHorario(horario: HorarioRow): void {
    this.openConfirmModal(
      'Eliminar horario',
      '¿Estás seguro de que deseas eliminar este horario?',
      () => this.eliminarHorario(horario)
    );
  }

  private eliminarHorario(horario: HorarioRow): void {
    const idUsuarioSolicitante = this.authService.getUserId();
    if (!idUsuarioSolicitante) return;

    this.adminPanelService
      .eliminarHorario({
        idUsuarioSolicitante,
        idHorarioActividad: horario.idHorarioActividad,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Horario eliminado correctamente');
          if (this.actividadSeleccionadaHorario) {
            this.cargarHorarios(this.actividadSeleccionadaHorario);
          }
        },
        error: (err) => {
          this.showError(err.error?.mensaje || 'Error al eliminar el horario');
        },
      });
  }

  // ============================================================================
  // Ubicación en cascada
  // ============================================================================

  private setupLocationCascade(form: FormGroup): void {
    const ubicacionGroup = form.get('ubicacion');
    if (!ubicacionGroup) return;

    // País -> Provincias
    ubicacionGroup.get('idPais')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((idPais) => {
      this.provincias = [];
      this.cantones = [];
      this.distritos = [];

      ubicacionGroup.get('idProvincia')?.reset(null, { emitEvent: false });
      ubicacionGroup.get('idCanton')?.reset(null, { emitEvent: false });
      ubicacionGroup.get('idDistrito')?.reset(null, { emitEvent: false });
      ubicacionGroup.get('idCanton')?.disable({ emitEvent: false });
      ubicacionGroup.get('idDistrito')?.disable({ emitEvent: false });

      if (idPais) {
        ubicacionGroup.get('idProvincia')?.enable({ emitEvent: false });
        this.loadingProvincias = true;
        this.referenceDataService.getProvincias(idPais).subscribe({
          next: (data) => {
            this.provincias = data;
            this.loadingProvincias = false;
            // Patch value if it exists (for initial load)
            const currentProv = ubicacionGroup.get('idProvincia')?.value;
            if (currentProv) {
              ubicacionGroup.get('idProvincia')?.patchValue(currentProv, { emitEvent: true });
            }
          },
          error: () => (this.loadingProvincias = false),
        });
      } else {
        ubicacionGroup.get('idProvincia')?.disable({ emitEvent: false });
      }
    });

    // Provincia -> Cantones
    ubicacionGroup.get('idProvincia')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((idProvincia) => {
      this.cantones = [];
      this.distritos = [];

      ubicacionGroup.get('idCanton')?.reset(null, { emitEvent: false });
      ubicacionGroup.get('idDistrito')?.reset(null, { emitEvent: false });
      ubicacionGroup.get('idDistrito')?.disable({ emitEvent: false });

      const idPais = ubicacionGroup.get('idPais')?.value;
      if (idPais && idProvincia) {
        ubicacionGroup.get('idCanton')?.enable({ emitEvent: false });
        this.loadingCantones = true;
        this.referenceDataService.getCantones(idPais, idProvincia).subscribe({
          next: (data) => {
            this.cantones = data;
            this.loadingCantones = false;
            const currentCanton = ubicacionGroup.get('idCanton')?.value;
            if (currentCanton) {
              ubicacionGroup.get('idCanton')?.patchValue(currentCanton, { emitEvent: true });
            }
          },
          error: () => (this.loadingCantones = false),
        });
      } else {
        ubicacionGroup.get('idCanton')?.disable({ emitEvent: false });
      }
    });

    // Cantón -> Distritos
    ubicacionGroup.get('idCanton')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((idCanton) => {
      this.distritos = [];
      ubicacionGroup.get('idDistrito')?.reset(null, { emitEvent: false });

      const idPais = ubicacionGroup.get('idPais')?.value;
      const idProvincia = ubicacionGroup.get('idProvincia')?.value;
      if (idPais && idProvincia && idCanton) {
        ubicacionGroup.get('idDistrito')?.enable({ emitEvent: false });
        this.loadingDistritos = true;
        this.referenceDataService.getDistritos(idPais, idProvincia, idCanton).subscribe({
          next: (data) => {
            this.distritos = data;
            this.loadingDistritos = false;
            const currentDistrito = ubicacionGroup.get('idDistrito')?.value;
             if (currentDistrito) {
              ubicacionGroup.get('idDistrito')?.patchValue(currentDistrito, { emitEvent: false });
            }
          },
          error: () => (this.loadingDistritos = false),
        });
      } else {
         ubicacionGroup.get('idDistrito')?.disable({ emitEvent: false });
      }
    });
  }

  // ============================================================================
  // Modal y mensajes
  // ============================================================================

  private openConfirmModal(title: string, message: string, action: () => void): void {
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalAction = action;
    this.isModalOpen = true;
  }

  confirmModalAction(): void {
    if (this.modalAction) {
      this.modalAction();
    }
    this.closeModal();
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.modalAction = null;
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.loadError = null;
    setTimeout(() => {
      this.successMessage = null;
      this.cdr.detectChanges();
    }, 4000);
  }

  private showError(message: string): void {
    this.loadError = message;
    this.successMessage = null;
    setTimeout(() => {
      this.loadError = null;
      this.cdr.detectChanges();
    }, 6000);
  }

  // ============================================================================
  // Helpers para el template
  // ============================================================================

  getNombreRol(idRol: number): string {
    return this.rolesDisponibles.find((r) => r.id === idRol)?.nombre || 'Desconocido';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('es-CR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  }

  formatTime(dateString: string): string {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleTimeString('es-CR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  }
}

