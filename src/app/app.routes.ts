import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/user/register.component';
import { ForgotPasswordComponent } from './pages/forgotPassword/forgot-password';
import { InscriptionsComponent } from './pages/events/inscriptions/inscriptions.component';
import { LandingComponent } from './pages/landing/landing.component';
import { ActivateComponent } from './pages/activate/activate.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { authGuard } from './core/guards/auth.guard';
import { OrganizationsComponent } from './pages/organizations/organizations.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { MyHoursComponent } from './pages/my-hours/my-hours.component';
import { CertificatesComponent } from './pages/certificates/certificates.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'activate', component: ActivateComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'events/inscriptions', component: InscriptionsComponent, canActivate: [authGuard] },
  { path: 'organizations', component: OrganizationsComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'my-hours', component: MyHoursComponent, canActivate: [authGuard] },
  { path: 'certificates', component: CertificatesComponent, canActivate: [authGuard] },
  // ... existing routes above ...
  { path: '**', redirectTo: '' }, // or redirectTo: '/',
];
