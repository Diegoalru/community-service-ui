import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { catchError, finalize, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

type PerfilVm = {
  idPerfil: number | null;
  idUsuario: number | null;
  idUbicacion: number | null;
  idIdentificador: number | null;
  idUniversidad: number | null;

  identificacion: string | null;
  nombre: string | null;
  apellidoP: string | null;
  apellidoM: string | null;
  fechaNacimiento: string | null;
  carrera: string | null;
  bibliografia: string | null;
  fechaDesde: string | null;
  fechaHasta: string | null;
  estado: string | null;

  universidadNombre: string | null;
  universidadSiglas: string | null;
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class ProfileComponent implements OnInit {
  isLoading = false;
  loadError: string | null = null;

  perfil: PerfilVm | null = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId() ?? 0;
    if (userId <= 0) {
      this.loadError = 'Debes iniciar sesión para ver tu perfil.';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.loadError = null;
    this.cdr.detectChanges();

    this.userService
      .getPerfilByUserId(userId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }),
        catchError((err) => {
          this.loadError = err?.error?.message || 'No se pudo cargar tu perfil.';
          this.perfil = null;
          this.cdr.detectChanges();
          return of(null);
        }),
      )
      .subscribe((data) => {
        if (!data) {
          this.perfil = null;
          this.cdr.detectChanges();
          return;
        }
        this.perfil = this.normalizePerfil(data as unknown);
        this.cdr.detectChanges();
      });
  }

  get estadoLabel(): string {
    const e = (this.perfil?.estado ?? '').toUpperCase();
    if (e === 'A') return 'Activo';
    if (e === 'I') return 'Inactivo';
    return this.perfil?.estado ?? '—';
  }

  get estadoBadgeClass(): string {
    const e = (this.perfil?.estado ?? '').toUpperCase();
    if (e === 'A') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    if (e === 'I') return 'border-slate-200 bg-slate-50 text-slate-700';
    return 'border-slate-200 bg-white text-slate-700';
  }

  private normalizePerfil(raw: unknown): PerfilVm {
    const obj: any = raw ?? {};

    const pick = <T = any>(...keys: string[]): T | undefined => {
      for (const k of keys) {
        const v = obj?.[k];
        if (v !== undefined && v !== null) return v as T;
      }
      return undefined;
    };

    const uni: any =
      pick('universidad', 'Universidad', 'idUniversidadNavigation', 'IdUniversidadNavigation') ?? null;

    return {
      idPerfil: pick<number>('idPerfil', 'IdPerfil') ?? null,
      idUsuario: pick<number>('idUsuario', 'IdUsuario') ?? null,
      idUbicacion: pick<number>('idUbicacion', 'IdUbicacion') ?? null,
      idIdentificador: pick<number>('idIdentificador', 'IdIdentificador') ?? null,
      idUniversidad: pick<number>('idUniversidad', 'IdUniversidad') ?? null,

      identificacion: pick<string>('identificacion', 'Identificacion') ?? null,
      nombre: pick<string>('nombre', 'Nombre') ?? null,
      // Variantes comunes (por DTOs previos en el repo)
      apellidoP: pick<string>('apellidoP', 'ApellidoP', 'primerApellido', 'PrimerApellido') ?? null,
      apellidoM: pick<string>('apellidoM', 'ApellidoM', 'segundoApellido', 'SegundoApellido') ?? null,
      fechaNacimiento: pick<string>('fechaNacimiento', 'FechaNacimiento') ?? null,
      carrera: pick<string>('carrera', 'Carrera') ?? null,
      bibliografia: pick<string>('bibliografia', 'Bibliografia', 'bibliografia', 'Bibliografía') ?? null,
      fechaDesde: pick<string>('fechaDesde', 'FechaDesde') ?? null,
      fechaHasta: pick<string>('fechaHasta', 'FechaHasta') ?? null,
      estado: pick<string>('estado', 'Estado') ?? null,

      universidadNombre: uni ? (uni.nombre ?? uni.Nombre ?? null) : null,
      universidadSiglas: uni ? (uni.siglas ?? uni.Siglas ?? null) : null,
    };
  }
}


