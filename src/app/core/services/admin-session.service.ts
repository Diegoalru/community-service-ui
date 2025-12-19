import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AdminPanelService } from './admin-panel.service';
import {
  OrganizacionConEstado,
  RolUsuario,
} from '../../shared/models/admin-panel.dto';

// Claves para sessionStorage
const STORAGE_KEYS = {
  ORGANIZACIONES: 'admin_organizaciones',
  ORG_ACTUAL: 'admin_org_actual',
  ROL_ACTUAL: 'admin_rol_actual',
} as const;

@Injectable({ providedIn: 'root' })
export class AdminSessionService {
  // Subjects privados
  private readonly organizacionesSubject = new BehaviorSubject<OrganizacionConEstado[]>([]);
  private readonly organizacionActualSubject = new BehaviorSubject<OrganizacionConEstado | null>(null);
  private readonly rolActualSubject = new BehaviorSubject<RolUsuario | null>(null);

  // Observables públicos
  readonly organizaciones$ = this.organizacionesSubject.asObservable();
  readonly organizacionActual$ = this.organizacionActualSubject.asObservable();
  readonly rolActual$ = this.rolActualSubject.asObservable();

  constructor(private adminPanelService: AdminPanelService) {
    this.hidratarDesdeStorage();
  }

  // ============================================================================
  // Getters síncronos
  // ============================================================================

  get organizaciones(): OrganizacionConEstado[] {
    return this.organizacionesSubject.getValue();
  }

  get organizacionActual(): OrganizacionConEstado | null {
    return this.organizacionActualSubject.getValue();
  }

  get rolActual(): RolUsuario | null {
    return this.rolActualSubject.getValue();
  }

  get isAdmin(): boolean {
    return this.rolActual?.isAdmin === true;
  }

  get idOrganizacionActual(): number | null {
    return this.organizacionActual?.idOrganizacion ?? null;
  }

  get hasActiveSession(): boolean {
    return this.organizacionActual !== null;
  }

  // ============================================================================
  // Métodos principales
  // ============================================================================

  /**
   * Carga las organizaciones con estado para un usuario y las cachea
   */
  cargarOrganizaciones(idUsuario: number): Observable<OrganizacionConEstado[]> {
    return this.adminPanelService.getOrganizacionesConEstado({ idUsuario }).pipe(
      tap((orgs) => {
        this.organizacionesSubject.next(orgs);
        this.guardarEnStorage(STORAGE_KEYS.ORGANIZACIONES, orgs);
      })
    );
  }

  /**
   * Establece la organización actual y su rol asociado
   */
  setOrganizacionActual(org: OrganizacionConEstado): void {
    this.organizacionActualSubject.next(org);
    // Extraer el rol principal (admin más privilegiado) para la sesión
    const primaryRol = this.getPrimaryAdminRole(org.rolesUsuario);
    this.rolActualSubject.next(primaryRol);

    this.guardarEnStorage(STORAGE_KEYS.ORG_ACTUAL, org);
    this.guardarEnStorage(STORAGE_KEYS.ROL_ACTUAL, primaryRol);
  }

  /**
   * Limpia toda la sesión de administración (organizaciones, org actual, rol)
   * Llamar al hacer logout o al iniciar sesión con nuevo usuario
   */
  clearSession(): void {
    // Limpiar subjects
    this.organizacionesSubject.next([]);
    this.organizacionActualSubject.next(null);
    this.rolActualSubject.next(null);

    // Limpiar sessionStorage
    sessionStorage.removeItem(STORAGE_KEYS.ORGANIZACIONES);
    sessionStorage.removeItem(STORAGE_KEYS.ORG_ACTUAL);
    sessionStorage.removeItem(STORAGE_KEYS.ROL_ACTUAL);
  }

  /**
   * Limpia solo la organización actual (para "salir" de una org sin perder la lista)
   */
  clearOrganizacionActual(): void {
    this.organizacionActualSubject.next(null);
    this.rolActualSubject.next(null);

    sessionStorage.removeItem(STORAGE_KEYS.ORG_ACTUAL);
    sessionStorage.removeItem(STORAGE_KEYS.ROL_ACTUAL);
  }

  // ============================================================================
  // Helpers privados
  // ============================================================================

  /**
   * Hidrata los subjects desde sessionStorage al iniciar el servicio
   */
  private hidratarDesdeStorage(): void {
    const orgsJson = sessionStorage.getItem(STORAGE_KEYS.ORGANIZACIONES);
    const orgActualJson = sessionStorage.getItem(STORAGE_KEYS.ORG_ACTUAL);
    const rolActualJson = sessionStorage.getItem(STORAGE_KEYS.ROL_ACTUAL);

    if (orgsJson) {
      try {
        const orgs = JSON.parse(orgsJson) as OrganizacionConEstado[];
        this.organizacionesSubject.next(orgs);
      } catch (e) {
        console.warn('Error al parsear organizaciones desde storage:', e);
      }
    }

    if (orgActualJson) {
      try {
        const org = JSON.parse(orgActualJson) as OrganizacionConEstado;
        this.organizacionActualSubject.next(org);
      } catch (e) {
        console.warn('Error al parsear org actual desde storage:', e);
      }
    }

    if (rolActualJson) {
      try {
        const rol = JSON.parse(rolActualJson) as RolUsuario;
        this.rolActualSubject.next(rol);
      } catch (e) {
        console.warn('Error al parsear rol actual desde storage:', e);
      }
    }
  }

  /**
   * Guarda un valor en sessionStorage como JSON
   */
  private guardarEnStorage(key: string, value: unknown): void {
    if (value === null || value === undefined) {
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, JSON.stringify(value));
    }
  }

  /**
   * Extrae el rol de administrador de mayor privilegio de un array de roles.
   */
  private getPrimaryAdminRole(roles: RolUsuario[] | null): RolUsuario | null {
    if (!roles || roles.length === 0) return null;
    return roles
      .filter(rol => rol.isAdmin)
      .sort((a, b) => a.idRol - b.idRol)[0] || null;
  }
}


