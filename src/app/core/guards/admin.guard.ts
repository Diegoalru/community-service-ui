import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminSessionService } from '../services/admin-session.service';

/**
 * Guard que protege las rutas de administración.
 * Requiere que el usuario tenga una sesión activa de organización y sea administrador.
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const adminSession = inject(AdminSessionService);
  const router = inject(Router);

  // Verificar que hay una sesión activa de organización
  if (!adminSession.hasActiveSession) {
    // Redirigir a la lista de organizaciones para seleccionar una
    router.navigate(['/organizations'], {
      queryParams: { returnUrl: state.url, error: 'no-session' }
    });
    return false;
  }

  // Verificar que el usuario es administrador de la organización
  if (!adminSession.isAdmin) {
    // Redirigir a organizaciones con mensaje de error
    router.navigate(['/organizations'], {
      queryParams: { error: 'no-admin' }
    });
    return false;
  }

  // Verificar que el idOrg de la ruta coincide con la organización actual
  const idOrgParam = route.paramMap.get('idOrg');
  if (idOrgParam) {
    const idOrgRuta = parseInt(idOrgParam, 10);
    if (idOrgRuta !== adminSession.idOrganizacionActual) {
      // El usuario intenta acceder a una organización diferente a la de su sesión
      router.navigate(['/organizations'], {
        queryParams: { error: 'org-mismatch' }
      });
      return false;
    }
  }

  return true;
};

