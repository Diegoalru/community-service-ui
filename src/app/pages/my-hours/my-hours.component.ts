import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { catchError, finalize, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { MyHoursService } from '../../core/services/my-hours.service';
import { type MisHorasDetalleDto, type MisHorasDto } from '../../shared/models/mis-horas.dto';

@Component({
  selector: 'app-my-hours',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-hours.html',
  styleUrl: './my-hours.css',
})
export class MyHoursComponent implements OnInit {
  isLoading = false;
  loadError: string | null = null;

  misHoras: MisHorasDto | null = null;

  constructor(
    private authService: AuthService,
    private myHoursService: MyHoursService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId() ?? 0;
    if (userId <= 0) {
      // La ruta está protegida con authGuard, pero dejamos fallback por seguridad.
      this.loadError = 'Debes iniciar sesión para ver tus horas.';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.loadError = null;
    this.cdr.detectChanges();

    this.myHoursService
      .getMisHoras(userId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          // En modo zoneless, forzamos refresh de la vista.
          this.cdr.detectChanges();
        }),
        catchError((err) => {
          this.loadError = err?.error?.message || 'No se pudieron cargar tus horas.';
          this.misHoras = null;
          this.cdr.detectChanges();
          return of(null);
        })
      )
      .subscribe((data) => {
        if (!data) {
          this.misHoras = {
            horasTotales: 0,
            actividades: 0,
            ultimaParticipacion: null,
            desglose: [],
          };
          this.cdr.detectChanges();
          return;
        }
        // Normalización mínima (por si el backend envía nulls)
        this.misHoras = {
          horasTotales: data.horasTotales ?? 0,
          actividades: data.actividades ?? (data.desglose?.length ?? 0),
          ultimaParticipacion: data.ultimaParticipacion ?? null,
          desglose: (data.desglose ?? []) as MisHorasDetalleDto[],
        };
        this.cdr.detectChanges();
      });
  }

  get items(): MisHorasDetalleDto[] {
    return this.misHoras?.desglose ?? [];
  }

  get totalHoras(): number {
    return this.misHoras?.horasTotales ?? 0;
  }

  get actividades(): number {
    return this.misHoras?.actividades ?? this.items.length;
  }

  get ultimaParticipacion(): string | null {
    return this.misHoras?.ultimaParticipacion ?? null;
  }
}


