# Painel de Monitoramento Infantil — Prefeitura do Rio de Janeiro

Sistema full-stack desenvolvido para apoiar técnicos de campo no acompanhamento de crianças em situação de vulnerabilidade social, integrando dados de **Saúde**, **Educação** e **Assistência Social**.

A aplicação permite identificar rapidamente casos críticos, inconsistências cadastrais e acompanhar a evolução dos atendimentos — com foco em **performance, usabilidade mobile e clareza operacional**.

---

## 🎯 Objetivo do Projeto

Construir um painel funcional que permita:

- Identificar crianças com **alertas ativos**
- Detectar **lacunas de dados (inconsistências)**
- Apoiar decisões rápidas no dia a dia do técnico
- Registrar e acompanhar **revisões de casos**

---

## 🧱 Arquitetura da Solução

A aplicação foi desenhada sob os princípios de **Separação de Preocupações (SoC)** e **Alta Coesão**, estruturada em camadas que garantem manutenibilidade e escalabilidade:

- **🔙 Camada de Serviço (Backend)**: API REST desenvolvida em Node.js com TypeScript. Implementa lógica de negócio complexa para recálculo de alertas, detecção de inconsistências em tempo real e gestão de autenticação **Stateless via JWT**.
- **🎨 Camada de Apresentação (Frontend)**: Arquitetura baseada em **Next.js 14 (App Router)**, utilizando uma estratégia híbrida de *Server Components* (para performance e SEO) e *Client Components* (para interatividade avançada com Mapas e Gráficos).
- **🗄️ Camada de Dados (Persistência)**: Banco de dados relacional **PostgreSQL** orquestrado pelo **Prisma ORM**. A arquitetura utiliza **Transações Atômicas** para garantir a integridade dos dados durante registros complexos de revisões técnicas.
- **🐳 Camada de Infraestrutura**: Ecossistema totalmente containerizado via **Docker**, garantindo paridade entre ambientes de desenvolvimento e produção através de redes virtuais isoladas para API e Banco de Dados.

---

## 🚀 Tecnologias Utilizadas

### 🔙 Backend — Node.js + Express + TypeScript

- **Node.js**: Alta performance em operações assíncronas, ideal para APIs escaláveis.
- **TypeScript**: Tipagem forte, resultando em menos erros em runtime e compartilhamento de contratos com frontend.
- **Prisma ORM + PostgreSQL**: Integridade relacional entre áreas, migrations automatizadas e cliente Type-safe.
- **JWT (JsonWebToken)**: Autenticação stateless com token contendo `preferred_username`.
- **Zod**: Validação de esquemas e contratos de dados para garantir integridade nas escritas.

### 🎨 Frontend — Next.js 14 + TypeScript

- **Next.js (App Router)**: Server Components para melhor performance e menor carga de JS no cliente.
- **Tailwind CSS**: Estilização rápida e consistente com CSS otimizado.
- **shadcn/ui**: Componentes acessíveis e modernos sem vendor lock-in.
- **Axios**: Cliente HTTP para comunicação performática com o backend.

### 📊 Visualização de Dados

- **Recharts**: Gráficos responsivos (Bar, Donut, Radar comparativo por bairro).
- **Leaflet + Marker Cluster**: Mapa interativo com agrupamento e visualização de densidade.
- **react-joyride**: Sistema de onboarding guiado com persistência de estado.

### 🧰 Bibliotecas Auxiliares

- `date-fns`: Manipulação de datas.
- `lucide-react`: Iconografia.
- `clsx` & `tailwind-merge`: Utilidades de CSS.
- `next-themes`: Gestão de temas (Dark Mode).
- `sonner`: Sistema de notificações (Toasts) de alta qualidade.
- `js-cookie`: Manipulação segura de tokens no cliente.

### 🧪 Qualidade e Infraestrutura

- **Jest & Supertest**: Suíte de testes unitários e integração (Backend).
- **React Testing Library**: Validação de comportamento de componentes (Frontend).
- **Playwright**: Testes E2E com gravação de jornada do usuário.
- **Docker & Docker Compose**: Containerização e orquestração completa do ambiente.

---

## 🔌 API — Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST   | `/auth/token`           | Autenticação e retorno do JWT |
| GET    | `/summary`              | Dados agregados do dashboard |
| GET    | `/inconsistencies`      | Lista detalhada de lacunas de dados |
| GET    | `/children`             | Lista com filtros e paginação |
| GET    | `/children/:id`         | Detalhe completo da criança |
| PATCH  | `/children/:id/review`  | Registra revisão técnica |

---

## 🧠 Regras de Negócio e Funcionalidades

### 🔍 Detecção de Inconsistências
Identifica automaticamente lacunas silenciosas:
- Criança sem escola informada.
- Vacinas pendentes ou atrasadas.
- Dados incompletos em secretarias específicas.
O sistema sugere ações corretivas mesmo sem alerta oficial disparado.

### 🔄 Reavaliação Automática
Ao editar dados (PATCH), a API reprocessa as regras de negócio em tempo real, removendo alertas ou inconsistências automaticamente assim que o dado é regularizado.

### 📈 Dashboard Inteligente
- **Cards Interativos**: Funcionam como filtros rápidos para a listagem.
- **Análise Territorial**: Gráficos por área e bairro para identificar zonas de risco.
- **Navegação Contextual**: Integração total entre visão macro (dashboard) e micro (prontuário).

### ❤️ Medidor de Vitalidade (HP Bar)
Visualização gamificada do status de vulnerabilidade:
- 🟢 **Verde**: Regular.
- 🟠 **Atenção**: Alertas pontuais.
- 🔴 **Crítico**: Múltiplos alertas ou pendências graves.
Inconsistências aparecem como um overlay visual pulsante sobre a barra.

### 🏫 Filtro por Escolas
Filtro multi-select que permite organizar o trabalho de campo por instituição de ensino.

### 🧭 Onboarding Guiado (Tour)
Sistema de ajuda interativo que guia o novo técnico pelas principais funcionalidades:
- **Persistência**: O tour lembra em qual passo você parou, mesmo se mudar de página ou recarregar o navegador.
- **Contextual**: Explicações específicas para cada tela (Dashboard, Lista e Prontuário).
- **Acesso Rápido**: Botão de ajuda permanente na Navbar para reiniciar o tour a qualquer momento.

---

## 📱 Responsividade e UX

- **Mobile-First**: Interface otimizada de 375px a 1440px.
- **Table-to-Cards**: Conversão automática de tabelas em cards verticais no mobile.
- **Touch-Friendly**: Filtros e menus otimizados para navegação por toque.
- **Modais Adaptativos**: Integração fluida entre o mapa e as listas de detalhes.

---

## ♿ Acessibilidade e Design

- Navegação completa por teclado.
- Uso rigoroso de `aria-labels` e HTML semântico.
- Conformidade com **WCAG AA**.
- **Dark Mode** nativo para redução de fadiga visual.

---

## 🐳 Como Rodar o Projeto

### Pré-requisitos
- Docker & Docker Compose instalados.

### Execução
1. Clone o repositório.
2. Na raiz do projeto, execute:
   ```bash
   docker compose up --build -d
   ```

### Acessos
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **API**: [http://localhost:3001](http://localhost:3001)

### ⚙️ Inicialização
- O container executa migrations do Prisma automaticamente.
- O banco é populado com o `seed.json` (25 crianças) no primeiro boot.

---

## 🔐 Credenciais de Teste
- **Login**: `tecnico@prefeitura.rio`
- **Senha**: `painel@2024`

> [!TIP]
> **Reset de Experiência**: Para simular um primeiro acesso e ver o Tour de boas-vindas novamente, abra o console do navegador e execute: `localStorage.clear(); location.reload();`

---

## 🧪 Testes e Qualidade

O projeto conta com uma suíte de testes automatizados para garantir a estabilidade das regras de negócio e da interface. Para facilitar a execução, foi implementado um **redirecionamento de comandos na raiz**, permitindo rodar os testes de ambos os pacotes sem sair da pasta principal.

### 🛠️ Comandos Disponíveis (Na Raiz)

- **Rodar todos os testes unitários/componente:**
  ```bash
  npm test
  ```
- **Rodar testes de E2E (Playwright):**
  ```bash
  npm run test:e2e
  ```
- **Rodar especificamente Backend ou Frontend:**
  ```bash
  npm run test:backend
  npm run test:frontend
  ```

### 📋 O que foi testado?
- **Backend (Jest + Supertest)**:
  - `auth.test.ts`: Validação do fluxo de login, proteção de rotas e integridade do middleware JWT.
  - `children.test.ts`: Testes rigorosos de filtros (bairro, área, nome), paginação no banco e detecção de inconsistências.
  - `summary.test.ts`: Garantia da precisão nos cálculos dos cards de resumo e estatísticas do dashboard.
- **Frontend (Jest + Testing Library)**:
  - `Navbar.test.tsx`: Verificação de navegação, responsividade do menu e estados de logout.
  - `ChildDetails.test.tsx`: Teste do ciclo de vida completo do prontuário, desde o carregamento de dados e renderização da barra de vida (HP Bar) até a submissão do formulário de revisão com mock de API.
- **E2E (Playwright)**:
  - `dashboard.spec.ts`: Simulação da **Jornada do Técnico**, cobrindo login, mapas interativos, auditoria de prontuários e alternância de temas.

### 📹 Jornada do Técnico e Geração de Vídeo (E2E)
A suíte de testes E2E está configurada para realizar a **Jornada Completa do Técnico**, simulando o uso real do sistema:
- Navegação entre Dashboard, Estatísticas e Mapas.
- Interação com o **Mapa de Calor** (zoom e clique em aglomerados).
- Acesso ao prontuário e conclusão de uma **revisão técnica** com sucesso.
- Validação visual da alternância para o **Modo Dark**.

Ao final de cada execução, o Playwright gera automaticamente um **vídeo da interação**, localizado em `frontend/test-results`, permitindo validar a experiência do usuário de forma visual e auditável.

#### 🎬 Demonstração da Jornada (E2E)
![Demonstração E2E](https://via.placeholder.com/800x450.png?text=Link+do+seu+GIF+aqui)

---

## 📊 Status de Implementação

- [x] Autenticação JWT
- [x] Dashboard com gráficos dinâmicos
- [x] Filtros avançados (Bairro, Escola, Alertas, Revisão)
- [x] Paginação e ordenação no servidor
- [x] Detecção inteligente de inconsistências
- [x] Mapa de calor e agrupamento de marcadores
- [x] Edição de dados com atualização de status em tempo real
- [x] Registro de revisão técnica
- [x] Onboarding guiado e interativo (Tour)
- [x] Responsividade completa (375px a 1440px)
- [x] Dark Mode e Acessibilidade (WCAG AA)
- [x] Testes Unitários no Backend (Jest)
- [x] Testes de Componente no Frontend (RTL)
- [x] Testes E2E (Playwright)

---

## ⚖️ Decisões Arquiteturais

- **Node.js vs Go**: Optei por Node.js para garantir maior produtividade e integração total de tipos com o frontend (TS), priorizando agilidade na entrega dos requisitos complexos de UI.
- **Prisma vs SQL**: O Prisma foi escolhido pela segurança de tipos e velocidade de desenvolvimento, facilitando a manutenção das relações entre as áreas de saúde, educação e social.
- **Server Components**: Uso estratégico para reduzir o "hydration cost" no cliente, mantendo a aplicação leve para dispositivos móveis simples.

---

## 🧪 Cenários Tratados (Edge Cases)
- Crianças sem dados em sistemas específicos (saúde/social/educação).
- Dados parciais ou inconsistentes (ex: idade vs data de nascimento).
- Acúmulo de alertas múltiplos em todas as áreas simultaneamente.
- Resolução automática de inconsistências após edição de dados.

---

## 🚀 Diferenciais do Projeto
1. **Inteligência de Dados**: Sugestão automática de ações baseada em inconsistências silenciosas.
2. **Visualização Avançada**: Gráfico Radar para perfil de vulnerabilidade + Heatmap territorial.
3. **UX de Campo**: Pensado para o técnico que usa o celular na rua (cards, botões grandes, contraste alto).
4. **Pronto para Produção**: Dockerizado, documentado e preparado para deploy (Vercel/Railway).

---

## 🔮 Melhorias Futuras
- Cache de consultas pesadas com Redis.
- Atualizações em tempo real via WebSockets.
- Auditoria completa de alterações nos prontuários.

---

**Desafio Técnico — Full-stack Pleno 🚀**
