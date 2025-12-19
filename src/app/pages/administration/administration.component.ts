import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, finalize, catchError, switchMap, debounceTime } from 'rxjs/operators';

import { AdminPanelService } from '../../core/services/admin-panel.service';
import { AdminSessionService } from '../../core/services/admin-session.service';
import { AuthService } from '../../core/services/auth.service';
import { ReferenceDataService } from '../../core/services/reference-data.service';
import {
  UsuarioDeOrganizacion,
  ActividadRow,
  CategoriaActividad,
  ActualizarOrganizacionDto,
} from '../../shared/models/admin-panel.dto';
import {
  Pais,
  Provincia,
  Canton,
  Distrito,
  Universidad,
} from '../../shared/models/reference-data.dto';
import { ActivityFormComponent } from './activity-form/activity-form.component';

@Component({
  selector: 'app-administration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, ActivityFormComponent],
  templateUrl: './administration.html',
  styleUrls: ['./administration.css'],
})
export class AdministrationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // --- Estado de la UI ---
  activeTab: 'configuracion' | 'miembros' | 'actividades' = 'configuracion';
  isLoading = false;
  loadError: string | null = null;
  successMessage: string | null = null;

  // --- Datos de la Organización ---
  idOrganizacion: number = 0;
  nombreOrganizacion: string = '';

  // --- Pestaña: Configuración ---
  organizacionForm!: FormGroup;
  universidades: Universidad[] = [];
  paises: Pais[] = [];
  provincias: Provincia[] = [];
  cantones: Canton[] = [];
  distritos: Distrito[] = [];
  loadingProvincias = false;
  loadingCantones = false;
  loadingDistritos = false;

  // --- Pestaña: Miembros ---
  usuarios: UsuarioDeOrganizacion[] = [];
  filteredUsuarios: UsuarioDeOrganizacion[] = [];
  usuarioSeleccionado: UsuarioDeOrganizacion | null = null;
  updatingUserId: number | null = null;
  rolesDisponibles = [
    { id: 1, nombre: 'Administrador' },
    { id: 2, nombre: 'Coordinador' },
    { id: 3, nombre: 'Asistente' },
    { id: 4, nombre: 'Voluntario' },
  ];

  get rolesParaDropdown() {
    return this.rolesDisponibles.filter(r => r.id !== 4);
  }
  miembrosSearchTerm = new Subject<string>();

  // --- Pestaña: Actividades ---
  actividades: ActividadRow[] = [];
  categorias: CategoriaActividad[] = [];
  isActivityFormVisible = false;
  selectedActivity: ActividadRow | null = null;

  // --- Modals ---
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
    this.initForms();
    this.setupMiembrosSearch();

    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap((params) => {
          const idParam = params.get('idOrg');
          if (idParam) {
            this.idOrganizacion = parseInt(idParam, 10);
            return of(this.idOrganizacion);
          }
          this.router.navigate(['/organizations']);
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

  private initForms(): void {
    this.organizacionForm = this.fb.group({
      organizacion: this.fb.group({
        idOrganizacion: [this.idOrganizacion],
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
    this.setupLocationCascade();
  }

  private loadInitialData(): void {
    this.isLoading = true;
    this.loadError = null;

    forkJoin({
      organizacion: this.adminPanelService.getOrganizacionById({ id: this.idOrganizacion }),
      usuarios: this.adminPanelService.getUsuariosPorOrg({ idOrganizacion: this.idOrganizacion }),
      actividades: this.adminPanelService.getActividadesPorOrg({ idOrganizacion: this.idOrganizacion }),
      categorias: this.adminPanelService.getCategoriasActividad(),
      paises: this.referenceDataService.getPaises(),
      universidades: this.referenceDataService.getUniversidades(),
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
          // Configuración
          this.paises = data.paises;
          this.universidades = data.universidades;
          if (data.organizacion) {
            this.nombreOrganizacion = data.organizacion.nombre;
            this.organizacionForm.patchValue({
              organizacion: data.organizacion,
              ubicacion: data.organizacion.ubicacion
            });
            if (data.organizacion.ubicacion?.idPais) {
              this.organizacionForm.get('ubicacion.idPais')?.setValue(data.organizacion.ubicacion.idPais, { emitEvent: true });
            }
          }

          // Miembros
          this.usuarios = data.usuarios;
          this.filteredUsuarios = data.usuarios;

          // Actividades
          this.actividades = data.actividades;
          this.categorias = data.categorias;
        },
        error: (err) => {
          this.loadError = `Error al cargar los datos de la organización. ${err.error?.mensaje || ''}`;
        },
      });
  }

  // ============================ Pestañas ============================
  selectTab(tab: 'configuracion' | 'miembros' | 'actividades'): void {
    this.activeTab = tab;
    this.isActivityFormVisible = false;
  }

  // ============================ Configuración ============================
  guardarConfiguracion(): void {
    if (this.organizacionForm.invalid) {
      this.organizacionForm.markAllAsTouched();
      return;
    }
    const idUsuarioSolicitante = this.authService.getUserId();
    if (!idUsuarioSolicitante) { this.showError('No se pudo verificar la identidad del usuario.'); return; }

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
          this.nombreOrganizacion = dto.organizacion.nombre;
        },
        error: (err) => this.showError(err.error?.mensaje || 'Error al guardar los cambios.'),
      });
  }

  // ============================ Miembros ============================
  private setupMiembrosSearch(): void {
    this.miembrosSearchTerm.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(term => {
      const lowerTerm = term.toLowerCase();
      this.filteredUsuarios = this.usuarios.filter(u =>
        u.nombre?.toLowerCase().includes(lowerTerm) ||
        u.apellidoP?.toLowerCase().includes(lowerTerm) ||
        u.username.toLowerCase().includes(lowerTerm)
      );
    });
  }

  onMiembrosSearch(event: Event): void {
    const term = (event.target as HTMLInputElement).value;
    this.miembrosSearchTerm.next(term);
  }

  seleccionarUsuario(usuario: UsuarioDeOrganizacion): void {
    this.usuarioSeleccionado = usuario;
  }

  isAdministrativeUser(usuario: UsuarioDeOrganizacion): boolean {
    return [1, 2, 3].includes(usuario.idRol);
  }

  cambiarRolUsuario(usuario: UsuarioDeOrganizacion, nuevoRolId: number): void {
    if (usuario.idRol === nuevoRolId) return;
    const idUsuarioSolicitante = this.authService.getUserId();
    if (!idUsuarioSolicitante) return;

    this.updatingUserId = usuario.idUsuario;
    this.adminPanelService.cambiarRolUsuario({
      idUsuarioSolicitante,
      idRolUsuarioOrganizacion: usuario.idRolUsuarioOrganizacion,
      idNuevoRol: nuevoRolId,
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.updatingUserId = null)
      )
      .subscribe({
        next: () => { this.showSuccess('Rol actualizado correctamente.'); this.recargarUsuarios(); },
        error: (err) => this.showError(err.error?.mensaje || 'Error al cambiar el rol.'),
      });
  }

  confirmarEliminarUsuario(usuario: UsuarioDeOrganizacion): void {
    this.openConfirmModal(
      'Eliminar Miembro',
      `¿Seguro que quieres remover a ${usuario.nombre || usuario.username} de la organización?`,
      () => this.eliminarUsuario(usuario)
    );
  }

  promoverVoluntario(usuario: UsuarioDeOrganizacion): void {
    this.openConfirmModal(
      'Promover Voluntario',
      `¿Seguro que quieres promover a ${usuario.nombre || usuario.username} al rol de Asistente?`,
      () => this.cambiarRolUsuario(usuario, 3) // 3 es el ID para Asistente
    );
  }

  private eliminarUsuario(usuario: UsuarioDeOrganizacion): void {
    const idUsuarioSolicitante = this.authService.getUserId();
    if (!idUsuarioSolicitante) return;

    this.adminPanelService.eliminarUsuarioOrg({
        idUsuarioSolicitante,
        idRolUsuarioOrganizacion: usuario.idRolUsuarioOrganizacion,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Usuario removido correctamente.');
          this.recargarUsuarios();
        },
        error: (err) => this.showError(err.error?.mensaje || 'Error al remover usuario.'),
      });
  }

  private recargarUsuarios(): void {
    this.adminPanelService.getUsuariosPorOrg({ idOrganizacion: this.idOrganizacion })
      .pipe(takeUntil(this.destroy$))
      .subscribe(usuarios => {
        this.usuarios = usuarios;
        this.filteredUsuarios = usuarios;
        this.cdr.detectChanges();
      });
  }

  // ============================ Actividades ============================
  showCreateActivityForm(): void {
    this.selectedActivity = null;
    this.isActivityFormVisible = true;
  }

  showEditActivityForm(activity: ActividadRow): void {
    this.selectedActivity = activity;
    this.isActivityFormVisible = true;
  }

  onActivityFormSubmitted(): void {
    this.showSuccess('Actividad guardada correctamente.');
    this.isActivityFormVisible = false;
    this.selectedActivity = null;
    this.recargarActividades();
  }

  onActivityFormCanceled(): void {
    this.isActivityFormVisible = false;
    this.selectedActivity = null;
  }

  confirmarEliminarActividad(actividad: ActividadRow): void {
    this.openConfirmModal(
      'Eliminar Actividad',
      `¿Seguro que quieres eliminar "${actividad.nombre}"? Esta acción no se puede deshacer.`,
      () => this.eliminarActividad(actividad)
    );
  }

  private eliminarActividad(actividad: ActividadRow): void {
    const idUsuarioSolicitante = this.authService.getUserId();
    if (!idUsuarioSolicitante) return;

    this.adminPanelService.eliminarActividad({ idUsuarioSolicitante, idActividad: actividad.idActividad })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => { this.showSuccess('Actividad eliminada.'); this.recargarActividades(); },
        error: (err) => this.showError(err.error?.mensaje || 'Error al eliminar la actividad.'),
      });
  }

  private recargarActividades(): void {
    this.isLoading = true;
    this.adminPanelService.getActividadesPorOrg({ idOrganizacion: this.idOrganizacion })
      .pipe(takeUntil(this.destroy$), finalize(() => this.isLoading = false))
      .subscribe(actividades => {
        this.actividades = actividades;
        this.cdr.detectChanges();
      });
  }

  // ============================ Ubicación en Cascada ============================
  private setupLocationCascade(): void {
    const ubicacionGroup = this.organizacionForm.get('ubicacion');
    if (!ubicacionGroup) return;

    ubicacionGroup.get('idPais')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(idPais => {
      this.provincias = []; this.cantones = []; this.distritos = [];
      ubicacionGroup.get('idProvincia')?.reset(null, { emitEvent: false });
      if (idPais) {
        ubicacionGroup.get('idProvincia')?.enable({ emitEvent: false });
        this.loadingProvincias = true;
        this.referenceDataService.getProvincias(idPais).subscribe(data => {
          this.provincias = data;
          this.loadingProvincias = false;
          const currentProv = ubicacionGroup.get('idProvincia')?.value;
          if (currentProv) ubicacionGroup.get('idProvincia')?.patchValue(currentProv, { emitEvent: true });
        });
      } else {
        ubicacionGroup.get('idProvincia')?.disable({ emitEvent: false });
      }
    });

    ubicacionGroup.get('idProvincia')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(idProvincia => {
      this.cantones = []; this.distritos = [];
      ubicacionGroup.get('idCanton')?.reset(null, { emitEvent: false });
      const idPais = ubicacionGroup.get('idPais')?.value;
      if (idPais && idProvincia) {
        ubicacionGroup.get('idCanton')?.enable({ emitEvent: false });
        this.loadingCantones = true;
        this.referenceDataService.getCantones(idPais, idProvincia).subscribe(data => {
          this.cantones = data;
          this.loadingCantones = false;
          const currentCanton = ubicacionGroup.get('idCanton')?.value;
          if (currentCanton) ubicacionGroup.get('idCanton')?.patchValue(currentCanton, { emitEvent: true });
        });
      } else {
        ubicacionGroup.get('idCanton')?.disable({ emitEvent: false });
      }
    });

    ubicacionGroup.get('idCanton')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(idCanton => {
      this.distritos = [];
      ubicacionGroup.get('idDistrito')?.reset(null, { emitEvent: false });
      const idPais = ubicacionGroup.get('idPais')?.value;
      const idProvincia = ubicacionGroup.get('idProvincia')?.value;
      if (idPais && idProvincia && idCanton) {
        ubicacionGroup.get('idDistrito')?.enable({ emitEvent: false });
        this.loadingDistritos = true;
        this.referenceDataService.getDistritos(idPais, idProvincia, idCanton).subscribe(data => {
          this.distritos = data;
          this.loadingDistritos = false;
          const currentDistrito = ubicacionGroup.get('idDistrito')?.value;
          if (currentDistrito) ubicacionGroup.get('idDistrito')?.patchValue(currentDistrito, { emitEvent: false });
        });
      } else {
        ubicacionGroup.get('idDistrito')?.disable({ emitEvent: false });
      }
    });
  }

  // ============================ Helpers y Modal ============================
  private openConfirmModal(title: string, message: string, action: () => void): void {
    this.modalTitle = title;
    this.modalMessage = message;
    this.modalAction = action;
    this.isModalOpen = true;
  }

  confirmModalAction(): void {
    if (this.modalAction) { this.modalAction(); }
    this.closeModal();
  }

  closeModal(): void {
    this.isModalOpen = false;
    this.modalAction = null;
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.loadError = null;
    setTimeout(() => (this.successMessage = null), 4000);
  }

  private showError(message: string): void {
    this.loadError = message;
    this.successMessage = null;
    setTimeout(() => (this.loadError = null), 6000);
  }

  getNombreRol(idRol: number): string {
    return this.rolesDisponibles.find((r) => r.id === idRol)?.nombre || 'Desconocido';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    try { return new Date(dateString).toLocaleDateString('es-CR', { year: 'numeric', month: 'short', day: 'numeric' }); }
    catch { return dateString; }
  }
}
