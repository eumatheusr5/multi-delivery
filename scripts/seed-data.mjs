import pg from 'pg'

const { Client } = pg

const client = new Client({
  host: 'multi-delivery-db-do-user-29786342-0.g.db.ondigitalocean.com',
  port: 25060,
  database: 'defaultdb',
  user: 'doadmin',
  password: 'AVNS_CxTNMRFwaq01_ltDS8c',
  ssl: { rejectUnauthorized: false }
})

async function seed() {
  try {
    console.log('🔌 Conectando ao banco...')
    await client.connect()

    // Criar tabela de itens do pedido
    console.log('📋 Criando tabela pedido_itens...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS pedido_itens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
        produto_id UUID REFERENCES produtos(id),
        nome_produto VARCHAR(255) NOT NULL,
        quantidade INTEGER NOT NULL DEFAULT 1,
        preco_unitario DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Adicionar campos extras na tabela pedidos
    console.log('📋 Adicionando campos extras em pedidos...')
    await client.query(`
      ALTER TABLE pedidos 
      ADD COLUMN IF NOT EXISTS numero_pedido SERIAL,
      ADD COLUMN IF NOT EXISTS endereco_entrega TEXT,
      ADD COLUMN IF NOT EXISTS observacoes TEXT,
      ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(50) DEFAULT 'dinheiro',
      ADD COLUMN IF NOT EXISTS troco_para DECIMAL(10, 2)
    `)

    // Inserir clientes de exemplo
    console.log('👥 Inserindo clientes...')
    const clientes = [
      { nome: 'João Silva', email: 'joao@email.com', telefone: '(11) 99999-1111', endereco: 'Rua das Flores, 123 - Centro' },
      { nome: 'Maria Santos', email: 'maria@email.com', telefone: '(11) 99999-2222', endereco: 'Av. Brasil, 456 - Jardim América' },
      { nome: 'Pedro Oliveira', email: 'pedro@email.com', telefone: '(11) 99999-3333', endereco: 'Rua São Paulo, 789 - Vila Nova' },
      { nome: 'Ana Costa', email: 'ana@email.com', telefone: '(11) 99999-4444', endereco: 'Rua Minas Gerais, 321 - Bela Vista' },
      { nome: 'Carlos Souza', email: 'carlos@email.com', telefone: '(11) 99999-5555', endereco: 'Av. Paulista, 1000 - Consolação' },
    ]

    for (const c of clientes) {
      await client.query(`
        INSERT INTO clientes (nome, email, telefone, endereco) 
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email) DO NOTHING
      `, [c.nome, c.email, c.telefone, c.endereco])
    }

    // Inserir produtos de exemplo
    console.log('📦 Inserindo produtos...')
    const produtos = [
      { nome: 'Pizza Margherita', descricao: 'Molho de tomate, mussarela, manjericão', preco: 45.90, estoque: 100 },
      { nome: 'Pizza Calabresa', descricao: 'Molho de tomate, mussarela, calabresa, cebola', preco: 48.90, estoque: 100 },
      { nome: 'Pizza Frango c/ Catupiry', descricao: 'Frango desfiado, catupiry, milho', preco: 52.90, estoque: 100 },
      { nome: 'Hambúrguer Clássico', descricao: 'Pão, carne 180g, queijo, alface, tomate', preco: 28.90, estoque: 50 },
      { nome: 'Hambúrguer Bacon', descricao: 'Pão, carne 180g, queijo, bacon crocante', preco: 34.90, estoque: 50 },
      { nome: 'Coca-Cola 2L', descricao: 'Refrigerante Coca-Cola 2 litros', preco: 12.00, estoque: 200 },
      { nome: 'Suco Natural Laranja', descricao: 'Suco de laranja natural 500ml', preco: 8.00, estoque: 100 },
      { nome: 'Água Mineral', descricao: 'Água mineral sem gás 500ml', preco: 4.00, estoque: 300 },
    ]

    const produtosIds = []
    for (const p of produtos) {
      const result = await client.query(`
        INSERT INTO produtos (nome, descricao, preco, estoque) 
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [p.nome, p.descricao, p.preco, p.estoque])
      produtosIds.push({ id: result.rows[0].id, ...p })
    }

    // Buscar clientes inseridos
    const clientesResult = await client.query('SELECT id, nome, endereco FROM clientes')
    const clientesList = clientesResult.rows

    // Inserir pedidos de exemplo
    console.log('🛒 Inserindo pedidos...')
    const statusOptions = ['pendente', 'preparando', 'saiu_entrega', 'entregue', 'cancelado']
    const pagamentoOptions = ['dinheiro', 'cartao_credito', 'cartao_debito', 'pix']

    for (let i = 0; i < 15; i++) {
      const cliente = clientesList[Math.floor(Math.random() * clientesList.length)]
      const status = statusOptions[Math.floor(Math.random() * statusOptions.length)]
      const pagamento = pagamentoOptions[Math.floor(Math.random() * pagamentoOptions.length)]
      
      // Selecionar 1-4 produtos aleatórios
      const numItens = Math.floor(Math.random() * 4) + 1
      const itensEscolhidos = []
      for (let j = 0; j < numItens; j++) {
        const produto = produtosIds[Math.floor(Math.random() * produtosIds.length)]
        const quantidade = Math.floor(Math.random() * 3) + 1
        itensEscolhidos.push({ ...produto, quantidade })
      }

      const total = itensEscolhidos.reduce((acc, item) => acc + (item.preco * item.quantidade), 0)
      const troco = pagamento === 'dinheiro' ? Math.ceil(total / 10) * 10 + 10 : null

      // Criar pedido com data aleatória nos últimos 7 dias
      const diasAtras = Math.floor(Math.random() * 7)
      const horasAtras = Math.floor(Math.random() * 24)
      const dataHora = new Date()
      dataHora.setDate(dataHora.getDate() - diasAtras)
      dataHora.setHours(dataHora.getHours() - horasAtras)

      const pedidoResult = await client.query(`
        INSERT INTO pedidos (cliente_id, total, status, endereco_entrega, forma_pagamento, troco_para, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [cliente.id, total, status, cliente.endereco, pagamento, troco, dataHora])

      const pedidoId = pedidoResult.rows[0].id

      // Inserir itens do pedido
      for (const item of itensEscolhidos) {
        await client.query(`
          INSERT INTO pedido_itens (pedido_id, produto_id, nome_produto, quantidade, preco_unitario, subtotal)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [pedidoId, item.id, item.nome, item.quantidade, item.preco, item.preco * item.quantidade])
      }
    }

    console.log('\n✅ Dados inseridos com sucesso!')
    
    // Mostrar resumo
    const resumo = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM clientes) as clientes,
        (SELECT COUNT(*) FROM produtos) as produtos,
        (SELECT COUNT(*) FROM pedidos) as pedidos,
        (SELECT COUNT(*) FROM pedido_itens) as itens
    `)
    console.log('\n📊 Resumo:')
    console.log(`  - Clientes: ${resumo.rows[0].clientes}`)
    console.log(`  - Produtos: ${resumo.rows[0].produtos}`)
    console.log(`  - Pedidos: ${resumo.rows[0].pedidos}`)
    console.log(`  - Itens de pedido: ${resumo.rows[0].itens}`)

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await client.end()
  }
}

seed()

