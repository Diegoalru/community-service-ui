import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { AdminPanelService } from '../../core/services/admin-panel.service';
import { AdminSessionService } from '../../core/services/admin-session.service';
import { AuthService } from '../../core/services/auth.service';
import { OrganizacionConEstado, RolUsuario } from '../../shared/models/admin-panel.dto';

@Component({
  selector: 'app-organizations',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mx-auto max-w-6xl px-6 py-8">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-semibold text-slate-900">Organizaciones</h1>
        <p class="mt-1 text-sm text-slate-600">
          Explora las organizaciones disponibles, únete como voluntario o administra las que te pertenecen.
        </p>
      </div>

      <!-- Mensajes de error/info -->
      <div *ngIf="errorMessage" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {{ errorMessage }}
      </div>
      <div *ngIf="successMessage" class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
        {{ successMessage }}
      </div>

      <!-- Loading -->
      <div *ngIf="isLoading" class="py-12 text-center">
        <p class="text-slate-500">Cargando organizaciones...</p>
      </div>

      <!-- Lista de organizaciones -->
      <div *ngIf="!isLoading" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div
          *ngFor="let org of organizaciones"
          class="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
        >
          <!-- Info de la organización -->
          <div>
            <h3 class="text-lg font-semibold text-slate-900">{{ org.nombre }}</h3>
            <p class="mt-1 text-sm text-slate-600 line-clamp-2">{{ org.descripcion || 'Sin descripción' }}</p>
          </div>

          <!-- Acciones y Roles -->
          <div class="mt-4 space-y-3">
            <!-- Botón de Admin -->
            <div *ngIf="isAdmin(org)">
              <button
                type="button"
                class="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                (click)="ingresarComoAdmin(org)"
              >
                Panel de Administración
              </button>
            </div>

            <!-- Botón de Voluntario (Suscripción/Anulación) -->
            <div *ngIf="isVoluntario(org)">
              <button
                type="button"
                class="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                [disabled]="processingOrgId === org.idOrganizacion"
                (click)="desuscribirseVoluntario(org)"
              >
                {{ processingOrgId === org.idOrganizacion ? 'Procesando...' : 'Anular Suscripción de Voluntario' }}
              </button>
            </div>

            <div *ngIf="!isVoluntario(org)">
              <button
                type="button"
                class="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                [disabled]="processingOrgId === org.idOrganizacion"
                (click)="suscribirseVoluntario(org)"
              >
                {{ processingOrgId === org.idOrganizacion ? 'Procesando...' : 'Quiero ser Voluntario' }}
              </button>
            </div>

            <!-- Lista de Roles del Usuario -->
            <div *ngIf="org.rolesUsuario && org.rolesUsuario.length > 0" class="pt-2">
              <p class="mb-1 text-xs font-semibold text-slate-500">Tus Roles:</p>
              <div class="flex flex-wrap gap-1.5">
                 <span *ngFor="let rol of org.rolesUsuario" class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                   [ngClass]="{
                     'bg-indigo-100 text-indigo-700': rol.isAdmin,
                     'bg-emerald-100 text-emerald-700': rol.idRol === 4,
                     'bg-amber-100 text-amber-700': !rol.isAdmin && rol.idRol !== 4
                   }"
                 >
                  {{ rol.nombreRol }}
                </span>
              </div>
            </div>

          </div>
        </div>

        <!-- Empty state -->
        <div
          *ngIf="organizaciones.length === 0"
          class="col-span-full rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center"
        >
          <p class="text-slate-500">No hay organizaciones disponibles.</p>
        </div>
      </div>
    </div>
  `,
})
export class OrganizationsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  organizaciones: OrganizacionConEstado[] = [];
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  processingOrgId: number | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private adminPanelService: AdminPanelService,
    private adminSessionService: AdminSessionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const errorParam = this.route.snapshot.queryParams['error'];
    if (errorParam === 'no-session') {
      this.errorMessage = 'Debes seleccionar una organización para acceder al panel de administración.';
    } else if (errorParam === 'no-admin') {
      this.errorMessage = 'No tienes permisos de administrador en esa organización.';
    } else if (errorParam === 'org-mismatch') {
      this.errorMessage = 'La organización solicitada no coincide con tu sesión actual.';
    }

    this.cargarOrganizaciones();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private cargarOrganizaciones(): void {
    const idUsuario = this.authService.getUserId();
    if (!idUsuario) {
      this.errorMessage = 'No se pudo obtener el ID del usuario.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.adminPanelService
      .getOrganizacionesConEstado({ idUsuario })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (orgs) => {
          this.organizaciones = orgs;
        },
        error: () => {
          this.errorMessage = 'Error al cargar las organizaciones. Intenta nuevamente.';
          this.organizaciones = [];
        },
      });
  }

  suscribirseVoluntario(org: OrganizacionConEstado): void {
    const idUsuario = this.authService.getUserId();
    if (!idUsuario) return;

    this.processingOrgId = org.idOrganizacion;
    this.errorMessage = null;
    this.successMessage = null;

    this.adminPanelService
      .gestionarVoluntariado({
        idUsuario,
        idOrganizacion: org.idOrganizacion,
        accion: 'suscribir',
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.processingOrgId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = `¡Te has unido a "${org.nombre}" como voluntario!`;
          this.cargarOrganizaciones();
        },
        error: (err) => {
          this.errorMessage = err.error?.mensaje || 'Error al suscribirse como voluntario.';
        },
      });
  }

  desuscribirseVoluntario(org: OrganizacionConEstado): void {
    const idUsuario = this.authService.getUserId();
    if (!idUsuario) return;

    this.processingOrgId = org.idOrganizacion;
    this.errorMessage = null;
    this.successMessage = null;

    this.adminPanelService
      .gestionarVoluntariado({
        idUsuario,
        idOrganizacion: org.idOrganizacion,
        accion: 'desuscribir',
      })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.processingOrgId = null;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.successMessage = `Has cancelado tu suscripción a "${org.nombre}".`;
          this.cargarOrganizaciones();
        },
        error: (err) => {
          this.errorMessage = err.error?.mensaje || 'Error al cancelar la suscripción.';
        },
      });
  }

  ingresarComoAdmin(org: OrganizacionConEstado): void {
    // The adminSessionService.setOrganizacionActual now handles extracting the primary role from org.rolesUsuario
    this.adminSessionService.setOrganizacionActual(org); 
    
    this.router.navigate(['/admin/organization', org.idOrganizacion]);
  }
  
  // --- Helpers para el template ---

  isVoluntario(org: OrganizacionConEstado): boolean {
    return org.rolesUsuario?.some(rol => rol.idRol === 4) ?? false;
  }

  isAdmin(org: OrganizacionConEstado): boolean {
    return org.rolesUsuario?.some(rol => rol.isAdmin) ?? false;
  }

  getAdminRole(org: OrganizacionConEstado): RolUsuario | null {
    if (!org.rolesUsuario) return null;
    // Devuelve el rol de admin de mayor privilegio (menor ID)
    return org.rolesUsuario
      .filter(rol => rol.isAdmin)
      .sort((a, b) => a.idRol - b.idRol)[0] || null;
  }
}

