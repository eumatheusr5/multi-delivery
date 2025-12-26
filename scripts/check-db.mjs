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

async function checkDB() {
  try {
    console.log('🔌 Conectando ao banco...')
    await client.connect()
    
    // Listar tabelas
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `)
    
    console.log('\n📋 Tabelas existentes:')
    tables.rows.forEach(t => console.log(`  - ${t.table_name}`))

    // Verificar estrutura de cada tabela
    for (const table of tables.rows) {
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1 
        ORDER BY ordinal_position
      `, [table.table_name])
      
      console.log(`\n📦 ${table.table_name}:`)
      columns.rows.forEach(c => {
        console.log(`    ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? 'NOT NULL' : ''} ${c.column_default ? `DEFAULT ${c.column_default}` : ''}`)
      })
    }

    // Contar registros
    console.log('\n📊 Contagem de registros:')
    for (const table of tables.rows) {
      const count = await client.query(`SELECT COUNT(*) FROM ${table.table_name}`)
      console.log(`  - ${table.table_name}: ${count.rows[0].count}`)
    }

  } catch (error) {
    console.error('❌ Erro:', error.message)
  } finally {
    await client.end()
  }
}

checkDB()

