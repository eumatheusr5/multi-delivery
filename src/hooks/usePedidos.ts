import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Pedido, StatusPedido } from '../types'

export const pedidosKeys = {
  all: ['pedidos'] as const,
  detail: (id: string) => ['pedidos', id] as const,
}

async function fetchPedidos(): Promise<Pedido[]> {
  const response = await fetch('/api/pedidos')
  if (!response.ok) throw new Error('Erro ao buscar pedidos')
  return response.json()
}

async function fetchPedido(id: string): Promise<Pedido> {
  const response = await fetch(`/api/pedidos/${id}`)
  if (!response.ok) throw new Error('Erro ao buscar pedido')
  return response.json()
}

async function updatePedidoStatus(id: string, status: StatusPedido): Promise<void> {
  const response = await fetch(`/api/pedidos/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  })
  if (!response.ok) throw new Error('Erro ao atualizar status')
}

export function usePedidos() {
  return useQuery({
    queryKey: pedidosKeys.all,
    queryFn: fetchPedidos,
  })
}

export function usePedido(id: string | null) {
  return useQuery({
    queryKey: pedidosKeys.detail(id!),
    queryFn: () => fetchPedido(id!),
    enabled: !!id,
  })
}

export function useUpdatePedidoStatus() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusPedido }) => 
      updatePedidoStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pedidosKeys.all })
    },
  })
}

