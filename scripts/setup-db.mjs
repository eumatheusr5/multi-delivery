import pg from 'pg'
import bcrypt from 'bcryptjs'

const { Client } = pg

const client = new Client({
  host: 'multi-delivery-db-do-user-29786342-0.g.db.ondigitalocean.com',
  port: 25060,
  database: 'defaultdb',
  user: 'doadmin',
  password: 'AVNS_CxTNMRFwaq01_ltDS8c',
  ssl: {
    rejectUnauthorized: false
  }
})

async function setup() {
  try {
    console.log('🔌 Conectando ao banco de dados...')
    await client.connect()
    console.log('✅ Conectado!')

    // Criar extensões
    console.log('📦 Criando extensões...')
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')

    // Criar tabela de usuários
    console.log('📋 Criando tabela de usuários...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar tabela de sessões
    console.log('📋 Criando tabela de sessões...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar tabela de pedidos
    console.log('📋 Criando tabela de pedidos...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        cliente_id UUID,
        total DECIMAL(10, 2) NOT NULL DEFAULT 0,
        status VARCHAR(50) NOT NULL DEFAULT 'pendente',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar tabela de produtos
    console.log('📋 Criando tabela de produtos...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS produtos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nome VARCHAR(255) NOT NULL,
        descricao TEXT,
        preco DECIMAL(10, 2) NOT NULL,
        estoque INTEGER NOT NULL DEFAULT 0,
        ativo BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar tabela de clientes
    console.log('📋 Criando tabela de clientes...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS clientes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        telefone VARCHAR(20),
        endereco TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Criar usuário admin
    console.log('👤 Criando usuário admin...')
    const email = 'matheusribeiro2704@gmail.com'
    const password = '123456'
    const name = 'Matheus Ribeiro'
    const role = 'admin'

    // Hash da senha
    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // Verificar se usuário já existe
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email])
    
    if (existingUser.rows.length > 0) {
      // Atualizar usuário existente
      await client.query(
        'UPDATE users SET name = $1, password_hash = $2, role = $3, updated_at = NOW() WHERE email = $4',
        [name, passwordHash, role, email]
      )
      console.log('✅ Usuário admin atualizado!')
    } else {
      // Inserir novo usuário
      await client.query(
        'INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4)',
        [email, name, passwordHash, role]
      )
      console.log('✅ Usuário admin criado!')
    }

    // Verificar usuário criado
    const user = await client.query('SELECT id, email, name, role FROM users WHERE email = $1', [email])
    console.log('📧 Usuário:', user.rows[0])

    console.log('\n🎉 Setup completo!')
    console.log('📧 Email: matheusribeiro2704@gmail.com')
    console.log('🔑 Senha: 123456')
    console.log('👑 Role: admin')

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await client.end()
  }
}

setup()

