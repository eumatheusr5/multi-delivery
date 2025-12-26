# Multi Delivery - Dashboard

Dashboard web moderna para gestão de entregas com menu lateral preto e sistema de autenticação.

## 🚀 Tecnologias

- **Vite** - Build tool
- **React 19** - Framework UI
- **TypeScript** - Tipagem estática
- **TanStack Query** - Data fetching
- **Zustand** - Estado global
- **React Router** - Roteamento
- **Tailwind CSS** - Estilização
- **Sonner** - Notificações
- **Lucide React** - Ícones

## 📦 Instalação

```bash
npm install
```

## 🏃 Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## 🏗️ Build

```bash
npm run build
```

## 🗄️ Banco de Dados

O banco de dados PostgreSQL está hospedado na DigitalOcean:

- **Cluster**: multi-delivery-db
- **Região**: nyc1
- **Versão**: PostgreSQL 17

### Migrações

As migrações estão em `infra/migrations/`. Para aplicar:

```bash
# Conecte-se ao banco e execute:
psql -h multi-delivery-db-do-user-29786342-0.g.db.ondigitalocean.com -p 25060 -U doadmin -d defaultdb -f infra/migrations/001_initial_schema.sql
```

## 🔐 Autenticação

O sistema de autenticação está implementado com:
- Login/Logout
- Proteção de rotas
- Persistência de sessão (localStorage)
- Row Level Security (RLS) no PostgreSQL

## 📁 Estrutura

```
src/
├── components/     # Componentes reutilizáveis
├── pages/          # Páginas da aplicação
├── stores/          # Estado global (Zustand)
└── main.tsx        # Entry point
```

## 🎨 Menu Lateral

O menu lateral preto inclui:
- **Pedidos** - Gestão de pedidos
- **Produtos** - Gestão de produtos
- **Clientes** - Gestão de clientes

## 🔒 Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Políticas granulares baseadas em user_id
- Senhas hasheadas com bcrypt (a ser implementado no backend)

## 📝 Próximos Passos

- [ ] Implementar backend API
- [ ] Integração completa com banco de dados
- [ ] CRUD completo para Pedidos, Produtos e Clientes
- [ ] Testes unitários e de integração

