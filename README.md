# Cineze Diagnóstico

Bem-vindo ao repositório do **Cineze Diagnóstico**! Esta é uma plataforma focada em avaliar a maturidade digital de empresas, oferecendo um diagnóstico completo (Raio-X), análise de mercado, perfil de cliente e um plano de ação automatizado em etapas, tudo envolto em uma interface moderna e de alta conversão.

## 🚀 Sobre o Projeto

O objetivo desta aplicação é gamificar e simplificar o entendimento da presença digital de negócios locais. Através da plataforma, o usuário consegue:
- Ter uma visão geral do seu "score" digital.
- Visualizar em quais canais precisa focar (Maturidade Digital).
- Analisar oportunidades de mercado.
- Mapear sua persona e canais de contato.
- Acompanhar métricas numéricas claras.
- Receber um plano com ações divididas em semanas, priorizadas por impacto.

### 🎨 Design System
Toda a interface foi construída seguindo as diretrizes do **Glassmorphism**, com foco em:
- Tons primários de Azul (`var(--blue-primary)`).
- Componentes flutuantes (translúcidos e com `backdrop-filter`).
- Feedback semântico restrito e claro (Vermelho para crítico, Amarelo para moderado, Azul para positivo).
- Tipografia Global com a fonte **Inter**.

## 🛠️ Stack Tecnológica

O projeto foi construído utilizando as seguintes tecnologias:
- **[Next.js](https://nextjs.org/)** (App Router) - Framework React
- **[React](https://reactjs.org/)** - UI
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática
- **Vanilla CSS / CSS Modules / Variables** - Estilização Global e Customizada
- **[Supabase](https://supabase.com/)** - Backend as a Service (Autenticação e Banco de Dados PostgreSql com `@supabase/ssr`)
- **[Recharts](https://recharts.org/)** - Visualização de Gráficos (Radar, Barras, etc.)

## ⚙️ Como Executar Localmente

Siga os passos abaixo para rodar o projeto na sua máquina local:

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/PedroPaulogg77/cineze-diagnostico.git
   cd cineze-diagnostico
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configure as Variáveis de Ambiente:**
   Crie um arquivo `.env.local` na raiz do projeto com as chaves do seu projeto no Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_do_supabase
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

5. **Acesse no navegador:**
   Navegue para [http://localhost:3000](http://localhost:3000) para ver o resultado.

## 📁 Estrutura de Diretórios (Resumo)
- `app/ (dashboard)`: Funcionalidades privadas - Visão do Dashboard (Raio-X, Maturidade, Comunicação, Mercado, Plano e Métricas)
- `app/ (auth)`: Rotas de Autenticação e Onboarding para preenchimento de dados
- `components/`: Componentes globais e reutilizáveis (modais, menus, layouts)
- `types/`: Definições globais de interfaces e tipos em TypeScript
