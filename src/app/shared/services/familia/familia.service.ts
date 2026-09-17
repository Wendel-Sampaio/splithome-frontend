import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type FamiliaMember = {
  id: string;
  name: string;
  email: string;
};

export type Familia = {
  id: string;
  name: string;
  familyCode: string;
  members: FamiliaMember[];
};

type TokenResponse = {
  token?: string;
  accessToken?: string;
};

@Injectable({
  providedIn: 'root'
})
export class FamiliaService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/family`;

  criarFamilia(nomeFamilia: string): Observable<string> {
    return this.http.post<unknown>(`${this.API}/create`, {
      name: nomeFamilia,
      familyName: nomeFamilia
    }).pipe(
      map((response) => this.extractToken(response))
    );
  }

  entrarNaFamilia(codigoFamilia: string): Observable<string> {
    return this.http.post<unknown>(`${this.API}/join`, {
      familyCode: codigoFamilia,
      code: codigoFamilia
    }).pipe(
      map((response) => this.extractToken(response))
    );
  }

  obterMinhaFamilia(): Observable<Familia | null> {
    return this.http.get<unknown>(`${this.API}/my-family`).pipe(
      map((response) => this.extractFamily(response))
    );
  }

  private extractToken(response: unknown): string {
    if (typeof response === 'string') {
      return response;
    }

    if (response && typeof response === 'object') {
      const tokenResponse = response as TokenResponse;
      const token = tokenResponse.token ?? tokenResponse.accessToken;
      if (typeof token === 'string' && token.trim()) {
        return token;
      }
    }

    throw new Error('Resposta inválida ao atualizar sessão da família.');
  }

  private extractFamily(response: unknown): Familia | null {
    const familyCandidate = Array.isArray(response) ? response[0] : response;

    if (!familyCandidate || typeof familyCandidate !== 'object') {
      return null;
    }

    const familyRecord = familyCandidate as Record<string, unknown>;
    const membersCandidate = familyRecord['members'];
    const members = Array.isArray(membersCandidate) ? membersCandidate : [];

    return {
      id: this.readString(familyRecord['id']),
      name: this.readString(familyRecord['name']),
      familyCode: this.readString(familyRecord['familyCode']),
      members: members.map((member): FamiliaMember => {
        const memberRecord = (member ?? {}) as Record<string, unknown>;
        return {
          id: this.readString(memberRecord['id']),
          name: this.readString(memberRecord['name']),
          email: this.readString(memberRecord['email'])
        };
      })
    };
  }

  private readString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }
}
