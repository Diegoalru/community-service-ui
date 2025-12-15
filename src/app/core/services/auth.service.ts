import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import {
  UsuarioLoginDto,
  RegistroCompletoDto,
  RequestPasswordRecoveryDto,
  ResetPasswordDto,
  ChangePasswordDto,
  ResendActivationDto,
  ApiMensaje
} from '../../shared/models/auth.dto';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_ID_KEY = 'user_id';

  constructor(private api: ApiService) {}

  // Getters
  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  getUserId(): number | null {
    const id = sessionStorage.getItem(this.USER_ID_KEY);
    return id ? parseInt(id, 10) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Session management
  private saveSession(token: string, userId?: number): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    if (userId) {
      sessionStorage.setItem(this.USER_ID_KEY, String(userId));
    }
  }

  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_ID_KEY);
  }

  // Auth endpoints
  login(dto: UsuarioLoginDto): Observable<ApiMensaje> {
    return this.api.post<ApiMensaje>('/Integracion/IniciarSesion', dto).pipe(
      tap(response => {
        if (response.token) {
          this.saveSession(response.token, response.idUsuario);
        }
      })
    );
  }

  register(dto: RegistroCompletoDto): Observable<ApiMensaje> {
    return this.api.post<ApiMensaje>('/Integracion/RegistroUsuario', dto);
  }

  activate(token: string): Observable<ApiMensaje> {
    return this.api.get<ApiMensaje>('/Integracion/ActivarCuenta', { token });
  }

  requestRecovery(dto: RequestPasswordRecoveryDto): Observable<ApiMensaje> {
    return this.api.post<ApiMensaje>('/Integracion/SolicitarRecuperacionPassword', dto);
  }

  resetPassword(dto: ResetPasswordDto): Observable<ApiMensaje> {
    return this.api.post<ApiMensaje>('/Integracion/RestablecerPassword', dto);
  }

  changePassword(dto: ChangePasswordDto): Observable<ApiMensaje> {
    return this.api.post<ApiMensaje>('/Integracion/CambiarPassword', dto);
  }

  resendActivation(dto: ResendActivationDto): Observable<ApiMensaje> {
    return this.api.post<ApiMensaje>('/Integracion/ReenviarActivacion', dto);
  }
}

