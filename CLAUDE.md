# SplitHome Frontend — Guia para Agentes Claude

## Stack
- Angular 19.2.0 (Standalone Components API)
- TypeScript 5.7.2 (strict mode ativado)
- Angular Material 19 (tema Azure Blue)
- RxJS 7.8, jwt-decode 4, moment.js 2
- SCSS para estilos

## Estrutura de pastas
```
src/app/
├── pages/         # Componentes de página: login, cadastro, home, meu-perfil
├── shared/        # Componentes e serviços reutilizáveis
│   ├── components/ # form-compra, compras, dialog-pagamento, logout
│   └── services/   # compra.service, transacao.service
├── core/          # Autenticação e modelos de domínio
│   ├── auth/       # user.service, http-interceptor, guards (login/home)
│   └── models/     # compra, user, despesa, categoria
├── app.routes.ts  # Configuração de rotas standalone
└── app.config.ts  # Providers da aplicação
```

## Convenções de código
- **Branches:** `{numero-da-issue}-{descricao-curta}` (ex: `15-add-field-family-register-user`)
- **Commits:** Conventional Commits (`feat:`, `fix:`, `refactor:`, `style:`, `test:`)
- **Branch principal:** `master`
- **Componentes:** sempre Standalone (`standalone: true`), nunca NgModules
- **Nomes:** português para pastas/propriedades de domínio (ex: `compra`, `despesa`, `cadastro`)
- **Serviços:** `providedIn: 'root'`, sem módulos
- **Estilos:** SCSS por componente

## Como rodar e testar
```bash
npm start          # servidor de desenvolvimento em localhost:4200
npm test           # testes Jasmine/Karma
npm run build      # build de produção em dist/splithome-front/
```

## Autenticação
- Token JWT armazenado em `localStorage`
- `http-interceptor.service.ts` adiciona o header Authorization automaticamente
- `loginGuard` protege rotas autenticadas
- `homeGuard` redireciona usuário já autenticado para fora de login/cadastro

## URL da API
- Configurada em `api-url.ts` na raiz do projeto (não commitado em produção)

## Ao resolver issues
1. Crie uma branch com o número da issue: `git checkout -b {numero}-{descricao}`
2. Use Standalone Components — nunca crie NgModules
3. Mantenha TypeScript strict: sem `any` sem justificativa
4. Adicione ou atualize o `.spec.ts` do componente/serviço alterado
5. Rode `npm test` para garantir que tudo passa
6. Abra um PR linkando a issue com `Closes #numero`
7. Não force-push em `master`
