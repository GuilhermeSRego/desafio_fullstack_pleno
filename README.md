# Desafio Técnico — Full-stack Pleno (Painel de Acompanhamento)

Este projeto consiste em um painel para que técnicos da Prefeitura acompanhem crianças em situação de vulnerabilidade social, cruzando dados de saúde, educação e assistência social.

## Tecnologias e Decisões Arquiteturais

### Backend
- **Node.js + Express + TypeScript**: Escolhidos por sua robustez e grande comunidade, facilitando um desenvolvimento ágil e seguro, com tipagem compartilhada ou semelhante ao Frontend.
- **PostgreSQL + Prisma ORM**: Prisma facilita a manipulação do banco de dados relacional com queries tipadas, gerando migrações automatizadas e simplificando o processo de `seed`. O uso do PostgreSQL atende ao requisito de uso de banco relacional e escala de forma confiável.
- **Autenticação**: Foi utilizado `jsonwebtoken` para gerar e validar tokens JWT, protegendo as rotas da API.

### Frontend
- **Next.js 14 (App Router) + TypeScript**: Traz performance e arquitetura moderna com React Server Components e excelente experiência de desenvolvimento.
- **Tailwind CSS + shadcn/ui**: Utilizados para uma prototipagem de UI rápida, moderna, responsiva e acessível, com componentes como Cards, Tables e Badges.
- **axios + js-cookie**: Utilizados para o gerenciamento fácil do token na requisição, onde `middleware.ts` cuida da proteção das rotas no Next.js e o interceptor do `axios` assegura a inserção do token nos headers.

### Infraestrutura
- O sistema inteiro roda via **Docker Compose**, criando três serviços (`db` para Postgres, `api` para o backend Node e `web` para o Frontend Next.js).

## Como Rodar o Projeto

Pré-requisito: **Docker e Docker Compose instalados e rodando.**

1. Clone/Baixe o repositório e acesse a pasta raiz.
2. No terminal, execute o comando:
   ```bash
   docker compose up --build
   ```
   *Nota: Se no seu ambiente for necessário usar o comando antigo, utilize `docker-compose up --build`*.

3. Aguarde o Docker baixar as imagens e iniciar os serviços. O backend fará o "push" das tabelas do Prisma no banco Postgres e injetará os dados do `seed.json` automaticamente na inicialização.

4. Acesse a aplicação no navegador:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - A API estará rodando internamente no `http://localhost:3001` (acessível via proxy ou rede docker).

## Credenciais de Teste

Para acessar o painel web, utilize as seguintes credenciais na página de Login:

- **E-mail:** `tecnico@prefeitura.rio`
- **Senha:** `painel@2024`

## O que foi implementado

- Login e proteção de rotas via Middleware.
- Dashboard agregado exibindo métricas de saúde, educação, assistência e os casos já revisados.
- Lista completa de crianças com filtros (por Bairro, Status de Alerta e Status de Revisão) e paginação.
- Detalhes do acompanhamento: Visualização customizada lidando com os casos onde há informações pendentes de algumas áreas.
- Ação "Marcar como Revisado" (via `PATCH`), atualizando o status na API e na interface em tempo real.

## O que eu faria diferente com mais tempo

- **Testes Automatizados**: Escrever testes E2E usando Playwright para os fluxos principais do painel (login, filtro, revisão) e testes unitários no backend (Jest) para garantir que as regras de negócio de agregação de dados não quebrem no futuro.
- **Refresh Token**: Implementaria uma lógica de refresh token caso a sessão do usuário expire.
- **Visualização de Dados (Gráficos)**: Usar o `recharts` para criar um mapa de calor por bairro ou gráficos de pizza ilustrando a porcentagem de casos revisados vs. pendentes.
- **CI/CD e Deploy em Nuvem**: Configurar um pipeline com GitHub Actions para deploy contínuo em serviços como Render ou Vercel.
- **Tratamento de Erros e Logs mais Robustos**: Integrar ferramentas como Sentry ou Winston no backend.
