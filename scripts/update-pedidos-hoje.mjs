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

async function updatePedidosHoje() {
  try {
    console.log('🔌 Conectando ao banco...')
    await client.connect()

    // Atualizar alguns pedidos para terem a data de hoje
    console.log('📅 Atualizando pedidos para data de hoje...')
    
    // Buscar os primeiros 8 pedidos
    const pedidos = await client.query(`
      SELECT id FROM pedidos 
      ORDER BY numero_pedido
      LIMIT 8
    `)

    const agora = new Date()
    
    for (let i = 0; i < pedidos.rows.length; i++) {
      const pedidoId = pedidos.rows[i].id
      // Criar datas de hoje com horários diferentes
      const horaAleatoria = new Date(agora)
      horaAleatoria.setHours(8 + i, Math.floor(Math.random() * 60), 0, 0)
      
      await client.query(`
        UPDATE pedidos 
        SET created_at = $1
        WHERE id = $2
      `, [horaAleatoria, pedidoId])
      
      console.log(`  ✓ Pedido atualizado para ${horaAleatoria.toLocaleString('pt-BR')}`)
    }

    console.log('\n✅ Pedidos atualizados para hoje com sucesso!')
    
    // Mostrar resumo
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    
    const resumo = await client.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status != 'cancelado' THEN total ELSE 0 END) as total_vendido
      FROM pedidos 
      WHERE created_at >= $1
    `, [hoje])
    
    console.log(`\n📊 Pedidos de hoje:`)
    console.log(`  - Quantidade: ${resumo.rows[0].total}`)
    console.log(`  - Total vendido: R$ ${parseFloat(resumo.rows[0].total_vendido || 0).toFixed(2)}`)

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await client.end()
  }
}

updatePedidosHoje()

