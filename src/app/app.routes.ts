import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { CadastroComponent } from './pages/cadastro/cadastro.component';
import { HomeComponent } from './pages/home/home.component';
import { loginGuard } from './core/auth/login.guard';

export const routes: Routes = [
    
    {path: "", redirectTo: "login", pathMatch: "full"},
    {path: "login", component: LoginComponent},
    {path: "cadastro", component: CadastroComponent},

    {path: "home", component: HomeComponent, canActivate: [loginGuard]}
];
