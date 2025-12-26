export interface Cliente {
  id: string
  nome: string
  email: string | null
  telefone: string | null
  endereco: string | null
  created_at: string
  updated_at: string
}

export interface Produto {
  id: string
  nome: string
  descricao: string | null
  preco: number
  estoque: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface PedidoItem {
  id: string
  pedido_id: string
  produto_id: string | null
  nome_produto: string
  quantidade: number
  preco_unitario: number
  subtotal: number
  created_at: string
}

export interface Pedido {
  id: string
  numero_pedido: number
  cliente_id: string | null
  cliente_nome: string | null
  cliente_telefone: string | null
  cliente_email: string | null
  total: number
  status: 'pendente' | 'preparando' | 'saiu_entrega' | 'entregue' | 'cancelado'
  endereco_entrega: string | null
  forma_pagamento: 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix'
  troco_para: number | null
  observacoes: string | null
  itens?: PedidoItem[]
  created_at: string
  updated_at: string
}

export type StatusPedido = Pedido['status']
export type FormaPagamento = Pedido['forma_pagamento']

