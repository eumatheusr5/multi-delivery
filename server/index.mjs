import express from 'express'
import cors from 'cors'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const { Client } = pg

const app = express()
app.use(cors())
app.use(express.json())

// Configuração do banco via variáveis de ambiente ou fallback para desenvolvimento
const dbConfig = {
  host: process.env.DB_HOST || 'multi-delivery-db-do-user-29786342-0.g.db.ondigitalocean.com',
  port: parseInt(process.env.DB_PORT || '25060'),
  database: process.env.DB_NAME || 'defaultdb',
  user: process.env.DB_USER || 'doadmin',
  password: process.env.DB_PASSWORD || 'AVNS_CxTNMRFwaq01_ltDS8c',
  ssl: {
    rejectUnauthorized: false
  }
}

// Função para conectar ao banco
async function getClient() {
  const client = new Client(dbConfig)
  await client.connect()
  return client
}

// Rota de login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' })
  }

  let client
  try {
    client = await getClient()

    // Buscar usuário
    const result = await client.query(
      'SELECT id, email, name, password_hash, role FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const user = result.rows[0]

    // Verificar senha
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    // Gerar token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias

    // Salvar sessão
    await client.query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    )

    // Retornar usuário e token
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    })

  } catch (error) {
    console.error('Erro no login:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  } finally {
    if (client) await client.end()
  }
})

// Rota para verificar token
app.get('/api/auth/me', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }

  let client
  try {
    client = await getClient()

    // Buscar sessão
    const sessionResult = await client.query(
      'SELECT user_id, expires_at FROM sessions WHERE token = $1',
      [token]
    )

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({ error: 'Sessão inválida' })
    }

    const session = sessionResult.rows[0]

    // Verificar expiração
    if (new Date(session.expires_at) < new Date()) {
      await client.query('DELETE FROM sessions WHERE token = $1', [token])
      return res.status(401).json({ error: 'Sessão expirada' })
    }

    // Buscar usuário
    const userResult = await client.query(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [session.user_id]
    )

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado' })
    }

    res.json({ user: userResult.rows[0] })

  } catch (error) {
    console.error('Erro ao verificar token:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  } finally {
    if (client) await client.end()
  }
})

// Rota de logout
app.post('/api/auth/logout', async (req, res) => {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(200).json({ message: 'Logout realizado' })
  }

  let client
  try {
    client = await getClient()
    await client.query('DELETE FROM sessions WHERE token = $1', [token])
    res.json({ message: 'Logout realizado' })
  } catch (error) {
    console.error('Erro no logout:', error)
    res.status(500).json({ error: 'Erro interno do servidor' })
  } finally {
    if (client) await client.end()
  }
})

// ==================== PEDIDOS ====================

// Listar todos os pedidos
app.get('/api/pedidos', async (req, res) => {
  let client
  try {
    client = await getClient()
    
    const result = await client.query(`
      SELECT 
        p.id,
        p.numero_pedido,
        p.total,
        p.status,
        p.endereco_entrega,
        p.forma_pagamento,
        p.troco_para,
        p.observacoes,
        p.created_at,
        c.id as cliente_id,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      ORDER BY p.created_at DESC
    `)

    res.json(result.rows)
  } catch (error) {
    console.error('Erro ao listar pedidos:', error)
    res.status(500).json({ error: 'Erro ao listar pedidos' })
  } finally {
    if (client) await client.end()
  }
})

// Buscar pedido por ID com itens
app.get('/api/pedidos/:id', async (req, res) => {
  const { id } = req.params
  let client
  try {
    client = await getClient()
    
    // Buscar pedido
    const pedidoResult = await client.query(`
      SELECT 
        p.*,
        c.nome as cliente_nome,
        c.telefone as cliente_telefone,
        c.email as cliente_email
      FROM pedidos p
      LEFT JOIN clientes c ON p.cliente_id = c.id
      WHERE p.id = $1
    `, [id])

    if (pedidoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' })
    }

    // Buscar itens do pedido
    const itensResult = await client.query(`
      SELECT * FROM pedido_itens WHERE pedido_id = $1
    `, [id])

    const pedido = pedidoResult.rows[0]
    pedido.itens = itensResult.rows

    res.json(pedido)
  } catch (error) {
    console.error('Erro ao buscar pedido:', error)
    res.status(500).json({ error: 'Erro ao buscar pedido' })
  } finally {
    if (client) await client.end()
  }
})

// Atualizar status do pedido
app.patch('/api/pedidos/:id/status', async (req, res) => {
  const { id } = req.params
  const { status } = req.body
  let client
  try {
    client = await getClient()
    
    await client.query(`
      UPDATE pedidos SET status = $1, updated_at = NOW() WHERE id = $2
    `, [status, id])

    res.json({ message: 'Status atualizado' })
  } catch (error) {
    console.error('Erro ao atualizar status:', error)
    res.status(500).json({ error: 'Erro ao atualizar status' })
  } finally {
    if (client) await client.end()
  }
})

// Servir arquivos estáticos do frontend em produção
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  
  // Todas as rotas não-API retornam o index.html (SPA)
  // Express 5 usa sintaxe diferente para catch-all
  app.get('/{*path}', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'))
    }
  })
}

const PORT = process.env.PORT || 3001
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`)
  console.log(`📦 Ambiente: ${process.env.NODE_ENV || 'development'}`)
})

