-- Multi Delivery - Schema Inicial
-- Banco: multi-delivery-db
-- Versão: 1.0.0

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Schema público
SET search_path TO public;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de sessões
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pendente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10, 2) NOT NULL,
    estoque INTEGER NOT NULL DEFAULT 0,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    telefone VARCHAR(20),
    endereco TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON pedidos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON clientes(email);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at BEFORE UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON produtos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- Função auxiliar para obter user_id atual da sessão
-- Esta função será chamada pela aplicação backend passando o user_id
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
    -- Esta função será implementada no backend através de SET LOCAL
    -- Por enquanto, retorna NULL (será sobrescrito pela aplicação)
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Políticas RLS para users (usuários só veem seus próprios dados)
-- Nota: As políticas serão aplicadas pelo backend através de SET LOCAL current_user_id
CREATE POLICY "users_select_own" ON users
    FOR SELECT USING (id = current_user_id());

CREATE POLICY "users_update_own" ON users
    FOR UPDATE USING (id = current_user_id());

-- Políticas RLS para sessions (usuários só veem suas próprias sessões)
CREATE POLICY "sessions_select_own" ON sessions
    FOR SELECT USING (user_id = current_user_id());

CREATE POLICY "sessions_insert_own" ON sessions
    FOR INSERT WITH CHECK (user_id = current_user_id());

CREATE POLICY "sessions_delete_own" ON sessions
    FOR DELETE USING (user_id = current_user_id());

-- Políticas RLS para pedidos (todos os usuários autenticados podem ver)
-- Nota: Para produção, ajuste conforme necessário
CREATE POLICY "pedidos_select_all" ON pedidos
    FOR SELECT USING (current_user_id() IS NOT NULL);

CREATE POLICY "pedidos_insert_all" ON pedidos
    FOR INSERT WITH CHECK (current_user_id() IS NOT NULL);

CREATE POLICY "pedidos_update_all" ON pedidos
    FOR UPDATE USING (current_user_id() IS NOT NULL);

-- Políticas RLS para produtos (todos os usuários autenticados podem ver)
CREATE POLICY "produtos_select_all" ON produtos
    FOR SELECT USING (current_user_id() IS NOT NULL);

CREATE POLICY "produtos_insert_all" ON produtos
    FOR INSERT WITH CHECK (current_user_id() IS NOT NULL);

CREATE POLICY "produtos_update_all" ON produtos
    FOR UPDATE USING (current_user_id() IS NOT NULL);

-- Políticas RLS para clientes (todos os usuários autenticados podem ver)
CREATE POLICY "clientes_select_all" ON clientes
    FOR SELECT USING (current_user_id() IS NOT NULL);

CREATE POLICY "clientes_insert_all" ON clientes
    FOR INSERT WITH CHECK (current_user_id() IS NOT NULL);

CREATE POLICY "clientes_update_all" ON clientes
    FOR UPDATE USING (current_user_id() IS NOT NULL);

-- Comentários nas tabelas
COMMENT ON TABLE users IS 'Usuários do sistema';
COMMENT ON TABLE sessions IS 'Sessões de autenticação';
COMMENT ON TABLE pedidos IS 'Pedidos de entrega';
COMMENT ON TABLE produtos IS 'Produtos disponíveis';
COMMENT ON TABLE clientes IS 'Clientes cadastrados';

