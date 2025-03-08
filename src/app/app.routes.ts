import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { CadastroComponent } from './pages/cadastro/cadastro.component';
import { HomeComponent } from './pages/home/home.component';
import { loginGuard } from './core/auth/guards/login.guard';
import { homeGuard } from './core/auth/guards/home.guard';

export const routes: Routes = [
    
    {path: "", redirectTo: "login", pathMatch: "full"},
    {path: "login", component: LoginComponent, canActivate: [homeGuard]},
    {path: "cadastro", component: CadastroComponent, canActivate: [homeGuard]},
    {path: "home", component: HomeComponent, canActivate: [loginGuard]}
];
