# Painel de Monitoramento Infantil — Prefeitura do Rio de Janeiro

Este projeto é um sistema full-stack desenvolvido para apoiar técnicos de campo no acompanhamento de crianças em situação de vulnerabilidade, integrando dados de Saúde, Educação e Assistência Social.

## 🚀 Justificativa das Tecnologias e Bibliotecas

### Backend (Node.js + Express + TypeScript)
- **Por que Node.js?**: Escolhido pela alta eficiência em operações de I/O e pela facilidade de compartilhar a tipagem do TypeScript com o frontend. A agilidade no processamento de requisições assíncronas é ideal para uma API de monitoramento.
- **Prisma ORM + PostgreSQL**: O PostgreSQL garante a integridade relacional necessária para cruzar dados de diferentes secretarias. O Prisma foi selecionado por fornecer um cliente tipado (Type-safe), reduzindo erros de runtime e facilitando migrações automatizadas.
- **JWT (JsonWebToken)**: Utilizado para garantir a segurança no acesso aos dados sensíveis, seguindo o padrão de autenticação stateless.

### Frontend (Next.js 14 + TypeScript)
- **Por que Next.js?**: O App Router permite utilizar Server Components para busca de dados eficiente e menor carga de JS no cliente, resultando em uma aplicação extremamente rápida em dispositivos móveis.
- **Tailwind CSS**: Escolhido por permitir uma prototipagem de UI rápida e consistente. Sua abordagem utility-first garante que o CSS gerado seja otimizado e fácil de manter.
- **shadcn/ui**: Biblioteca de componentes de alta qualidade baseada em Radix UI. Foi escolhida pelo foco em acessibilidade e por permitir total controle sobre o código dos componentes.

### Visualização e Mapas
- **Leaflet**: Biblioteca leve e extensiva para visualização geoespacial. Essencial para o requisito de Mapa de Calor sem sobrecarregar o navegador do técnico.
- **Recharts**: Selecionada pela integração nativa com React e pela excelente responsividade dos gráficos, facilitando a visualização de dados complexos em telas pequenas.

---

## 🔍 Insights Técnicos e Funcionalidades

### 1. Detecção Inteligente de Inconsistências
O sistema analisa os dados brutos para identificar "lacunas silenciosas" (crianças sem alertas mas com dados pendentes):
- **Análise Proativa**: Identifica quando faltam dados essenciais (escola, frequência, vacinas) que não dispararam alertas automáticos.
- **Sugestão Técnica**: O backend sugere o alerta apropriado, guiando o técnico na regularização do caso.

### 2. Edição e Resolução Dinâmica
- **Recálculo em Tempo Real**: Ao salvar uma edição (PATCH), a API reavalia as regras de negócio. Se o técnico regularizar um dado (ex: atualizar escola), o alerta de inconsistência é removido automaticamente do dashboard.
- **Comparativo de Evolução**: No detalhe da criança, um gráfico ilustra a melhora ou piora dos indicadores após o acompanhamento.

### 3. Responsividade e UX Móvel (Table-to-Cards)
- **Transformação Automática**: Em telas menores (mobile), as tabelas densas são convertidas em cartões verticais (Cards) interativos para evitar scroll horizontal.
- **Filtros Adaptativos**: Os filtros e o menu de abas (Tabs) possuem rolagem horizontal otimizada para toque.

### 4. Acessibilidade e Design System
- **Navegação por Teclado**: Ordem de tabulação lógica e focos visíveis em todos os elementos.
- **Dark Mode**: Implementado via `next-themes` para reduzir fadiga visual.
- **Tags Semânticas**: Uso rigoroso de HTML5 (main, nav, section, aria-labels).

---

## 🐳 Como Rodar o Projeto (Docker)

O projeto é 100% conteinerizado via **Docker Compose**.

1. **Clone o repositório** e acesse a pasta raiz.
2. **Execute o comando**:
   ```bash
   docker compose up --build -d
   ```
3. **Acesso**:
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **Backend API**: [http://localhost:3001](http://localhost:3001)

### Inicialização Automática
O container `api` executa automaticamente as migrações do Prisma e o script de `seed` para popular o banco com as 25 crianças do `seed.json`.

---

## 🔑 Credenciais de Teste (Usuário Técnico)

- **Login**: `tecnico@prefeitura.rio`
- **Senha**: `painel@2024`

---

## 🛠️ O que foi implementado

- [x] Login JWT com proteção de rotas via Middleware.
- [x] Dashboard com indicadores de resumo e gráficos de rosca/barras.
- [x] Listagem com filtros de Bairro, Alertas (Multi-select), Revisão e Nome.
- [x] Ordenação dinâmica por Nome, Bairro, Idade e Volume de Alertas.
- [x] Detecção de inconsistências cadastrais com sugestão de correção.
- [x] Mapa de calor (Heatmap) por densidade de alertas nos bairros.
- [x] Edição completa de dados com resolução automática de alertas.
- [x] Ação de "Marcar como Revisado" com feedback visual.
- [x] Dark Mode e conformidade com WCAG AA.

---
**Desafio Técnico — Full-stack Pleno**
