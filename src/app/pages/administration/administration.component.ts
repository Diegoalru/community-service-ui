import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, finalize, map, of } from 'rxjs';
import { UserService} from '../../core/services/user.service';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { userRow } from '../../models/user';



@Component({
  selector: 'app-administration',
  standalone: true,
  templateUrl: './administration.html',
  styleUrls: ['./administration.css'],
})
export class AdministrationComponent {
  isModalOpen = false;
  modalTitle = 'Confirmación';
  modalMessage = 'Inscripción exitosa.';
  isLoading = false;
  loadError: string | null = null;
    // Tabla / acciones
  private savingIds = new Set<number>();
  users: userRow[] = [];
  registeredUserIds = new Set<string>();

  constructor(
    private Adminservice: UserService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUser();
  }

  
    private loadUser(): void {
      this.isLoading = true;
      this.loadError = null;
  
      this.Adminservice
        .getUser(this.authService.getUserId() ?? 0)
        .pipe(
          map((items) => items.map((dto) => this.toRow(dto))),
          catchError(() => {
            // Sin validación ni auth; si el API no está arriba todavía, dejamos 0 datos.
            this.loadError = null;
            return of([] as userRow[]);
          }),
          finalize(() => {
            this.isLoading = false;
            // En modo zoneless, forzamos refresh de la vista.
            this.cdr.detectChanges();
          })
        )
        .subscribe((rows) => {
          this.users = rows;
          // Hidratamos "ya inscrito" desde el backend (usuarioInscrito).
          this.registeredUserIds = new Set(rows.filter((r) => r.userName).map((r) => r.userName));
          // Extra safety: si el backend deja la conexión abierta por alguna razón,
          // al menos no nos quedamos "cargando" luego de recibir data.
          this.isLoading = false;
          this.cdr.detectChanges();
        });
    }

    private toRow(dto: userRow): userRow {

    
        return {
          userName: String(dto.userName)
        };
      }



   openModal(title: string, message: string): void {
    this.modalTitle = title;
    this.modalMessage = message;
    this.isModalOpen = true;
  }

 

   closeModal(): void {
    this.isModalOpen = false;
  }

}
