import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AdminSessionService } from '../../../core/services/admin-session.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a routerLink="/" class="flex items-center gap-2">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white"
            aria-hidden="true"
          >
            CS
          </div>
          <div>
            <p class="text-sm font-semibold text-slate-900">Community Service</p>
            <p class="text-xs text-slate-500">Sistema de voluntariado</p>
          </div>
        </a>

        <nav class="flex items-center gap-2">
          <!-- Estado logeado -->
          <ng-container *ngIf="auth.loggedIn$ | async; else loggedOut">
            <span
              class="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
            >
              <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
              Usuario Logeado
            </span>

            <details class="relative">
              <summary
                class="list-none cursor-pointer rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-950
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
              >
                Menú
              </summary>

              <div
                class="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1 shadow-lg z-50"
              >
                <!-- Indicador de organización activa -->
                <div *ngIf="adminSession.organizacionActual$ | async as orgActual"
                     class="mx-2 mb-2 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                  <p class="text-xs font-medium text-indigo-600">Organización activa:</p>
                  <p class="text-sm font-semibold text-indigo-900 truncate">{{ orgActual.nombre }}</p>
                  <div class="mt-2 flex gap-2">
                    <a
                      [routerLink]="['/admin/organization', orgActual.idOrganizacion]"
                      class="flex-1 rounded-md bg-indigo-600 px-2 py-1 text-center text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                      Panel Admin
                    </a>
                    <button
                      type="button"
                      (click)="salirDeOrganizacion()"
                      class="rounded-md border border-indigo-300 bg-white px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                    >
                      Salir
                    </button>
                  </div>
                </div>

                <a
                  routerLink="/events/inscriptions"
                  routerLinkActive="bg-slate-100"
                  class="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Ver eventos
                </a>
                <a
                  routerLink="/organizations"
                  routerLinkActive="bg-slate-100"
                  class="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Ver organizaciones
                </a>
                <a
                  routerLink="/profile"
                  routerLinkActive="bg-slate-100"
                  class="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Ver perfil
                </a>
                <a
                  routerLink="/my-hours"
                  routerLinkActive="bg-slate-100"
                  class="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Ver mis horas
                </a>

                <!-- Separador y logout -->
                <div class="my-1 border-t border-slate-200"></div>
                <button
                  type="button"
                  (click)="logout()"
                  class="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Cerrar sesión
                </button>
              </div>
            </details>
          </ng-container>

          <!-- Estado NO logeado -->
          <ng-template #loggedOut>
            <a
              routerLink="/login"
              class="rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Iniciar sesión
            </a>
            <a
              routerLink="/register"
              class="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Crear cuenta
            </a>
          </ng-template>
        </nav>
      </div>
    </header>
  `,
})
export class NavbarComponent {
  constructor(
    public auth: AuthService,
    public adminSession: AdminSessionService,
    private router: Router
  ) {}

  salirDeOrganizacion(): void {
    this.adminSession.clearOrganizacionActual();
    this.router.navigate(['/organizations']);
  }

  logout(): void {
    this.adminSession.clearSession();
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}


