# Categorias da família

Nos formulários de compra e despesa fixa, **Criar ou gerenciar categorias** abre o gerenciamento das categorias customizadas da família. O botão aparece para usuários com família, independentemente do plano.

- Criar e selecionar: cadastra o nome na API e seleciona o ID retornado no formulário.
- Renomear: altera a categoria para toda a família; nomes duplicados são informados sem fechar o diálogo.
- Desativar: exige confirmação, remove a categoria das opções e preserva o histórico.
- Edição de transação com categoria desativada: exige escolher uma categoria ativa, seguindo a validação do backend.

Compras, despesas, detalhes e gráficos exibem `categoryDetails`, com tradução e ícone para categorias padrão e o nome original para as customizadas. Categorias diferentes com o mesmo nome conservam seus IDs e não são agrupadas pelo frontend. O seletor e os payloads de criação/edição usam `categoryId`; códigos legados de transações antigas são resolvidos para o ID da categoria padrão.

A lista é consultada ao abrir os formulários e atualizada depois do gerenciamento, sem cache global entre famílias. Falhas de carregamento oferecem nova tentativa e bloqueiam o envio até carregar as opções. Usuários sem família podem selecionar os padrões.

O filtro da lista de compras envia `categoryId` ao backend, mantendo a paginação e os outros filtros. Esta versão deve ser publicada com o backend que suporta esse parâmetro e os endpoints GET/POST/PUT/DELETE em `/api/transactions/categories`.

Validação:

```bash
npm run build
npm run test:ci
```
