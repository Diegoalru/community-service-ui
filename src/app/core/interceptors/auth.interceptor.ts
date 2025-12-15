import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Add Bearer token to /api/* requests if token exists
  let request = req;
  const token = authService.getToken();

  if (token && req.url.includes('/api/')) {
    request = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Unauthorized - clear session and redirect to login
        authService.logout();
        router.navigate(['/login'], {
          queryParams: { returnUrl: router.url }
        });
      } else if (error.status === 403) {
        // Forbidden - user doesn't have permission
        console.error('Acceso denegado:', error.message);
      }
      return throwError(() => error);
    })
  );
};

