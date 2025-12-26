import { useState, useEffect, useCallback } from 'react'
import { usePedidos, usePedido, useUpdatePedidoStatus } from '../hooks/usePedidos'
import type { Pedido, StatusPedido } from '../types'
import { 
  Clock, 
  ChefHat, 
  Truck, 
  CheckCircle2, 
  XCircle,
  Phone,
  MapPin,
  CreditCard,
  Banknote,
  QrCode,
  User,
  Package,
  Calendar,
  Check,
  MessageSquare,
  Printer,
  X,
  AlertCircle,
  Bell,
  Search,
  ChevronDown,
  Filter
} from 'lucide-react'
import { toast } from 'sonner'

const statusConfig: Record<StatusPedido, { label: string; color: string; bgColor: string; activeBg: string; activeText: string; icon: typeof Clock }> = {
  pendente: { label: 'Pendente', color: 'text-amber-700', bgColor: 'bg-amber-100', activeBg: 'bg-amber-500', activeText: 'text-white', icon: Clock },
  preparando: { label: 'Preparando', color: 'text-blue-700', bgColor: 'bg-blue-100', activeBg: 'bg-blue-600', activeText: 'text-white', icon: ChefHat },
  saiu_entrega: { label: 'Saiu p/ Entrega', color: 'text-purple-700', bgColor: 'bg-purple-100', activeBg: 'bg-purple-600', activeText: 'text-white', icon: Truck },
  entregue: { label: 'Entregue', color: 'text-emerald-700', bgColor: 'bg-emerald-100', activeBg: 'bg-emerald-600', activeText: 'text-white', icon: CheckCircle2 },
  cancelado: { label: 'Cancelado', color: 'text-red-700', bgColor: 'bg-red-100', activeBg: 'bg-red-600', activeText: 'text-white', icon: XCircle },
}

const pagamentoConfig: Record<string, { label: string; icon: typeof CreditCard; shortLabel: string }> = {
  dinheiro: { label: 'Dinheiro', shortLabel: 'Dinheiro', icon: Banknote },
  cartao_credito: { label: 'Cartão de Crédito', shortLabel: 'Crédito', icon: CreditCard },
  cartao_debito: { label: 'Cartão de Débito', shortLabel: 'Débito', icon: CreditCard },
  pix: { label: 'PIX', shortLabel: 'PIX', icon: QrCode },
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatTime(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', { 
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString))
}

function formatFullDate(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR', { 
    day: '2-digit', 
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString))
}

function isToday(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
}

// Considerar pago se status é "entregue" ou se não é dinheiro (cartão/pix = pago no ato)
function isPago(pedido: Pedido): boolean {
  if (pedido.status === 'entregue') return true
  if (pedido.status === 'cancelado') return false
  if (pedido.forma_pagamento !== 'dinheiro') return true
  return false
}

// Modal de Confirmação
function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'default',
  isLoading = false
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger' | 'success'
  isLoading?: boolean
}) {
  if (!isOpen) return null

  const variantStyles = {
    default: 'bg-slate-600 hover:bg-slate-700',
    danger: 'bg-red-600 hover:bg-red-700',
    success: 'bg-emerald-600 hover:bg-emerald-700'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              variant === 'danger' ? 'bg-red-100' : variant === 'success' ? 'bg-emerald-100' : 'bg-slate-100'
            }`}>
              <AlertCircle size={24} className={
                variant === 'danger' ? 'text-red-600' : variant === 'success' ? 'text-emerald-600' : 'text-slate-600'
              } />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{message}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-colors disabled:opacity-50 ${variantStyles[variant]}`}
          >
            {isLoading ? 'Aguarde...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

// Modal de Novo Pedido (estilo iFood)
function NovoPedidoModal({ 
  pedido, 
  onAccept, 
  onReject,
  isLoading
}: {
  pedido: Pedido
  onAccept: () => void
  onReject: () => void
  isLoading: boolean
}) {
  const pagamento = pagamentoConfig[pedido.forma_pagamento] || pagamentoConfig.dinheiro

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header animado */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
            <Bell size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold">Novo Pedido!</h2>
          <p className="text-amber-100">Pedido #{pedido.numero_pedido}</p>
        </div>

        {/* Conteúdo */}
        <div className="p-6 space-y-4">
          {/* Cliente */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <User size={18} className="text-gray-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">{pedido.cliente_nome || 'Cliente não informado'}</p>
              {pedido.cliente_telefone && (
                <p className="text-sm text-gray-500">{pedido.cliente_telefone}</p>
              )}
            </div>
          </div>

          {/* Endereço */}
          {pedido.endereco_entrega && (
            <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-3">
              <MapPin size={18} className="text-gray-400 mt-0.5 shrink-0" />
              <span className="text-sm text-gray-700">{pedido.endereco_entrega}</span>
            </div>
          )}

          {/* Itens resumo */}
          <div className="border border-gray-100 rounded-lg p-3">
            <p className="text-sm text-gray-500 mb-2">{pedido.itens?.length || 0} item(ns)</p>
            <div className="space-y-1">
              {pedido.itens?.slice(0, 3).map((item) => (
                <p key={item.id} className="text-sm text-gray-700">
                  {item.quantidade}x {item.nome_produto}
                </p>
              ))}
              {pedido.itens && pedido.itens.length > 3 && (
                <p className="text-sm text-gray-400">+{pedido.itens.length - 3} mais...</p>
              )}
            </div>
          </div>

          {/* Pagamento e Total */}
          <div className="flex items-center justify-between bg-emerald-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-gray-600">
              <pagamento.icon size={18} />
              <span className="text-sm">{pagamento.label}</span>
            </div>
            <span className="text-xl font-bold text-emerald-600">{formatCurrency(Number(pedido.total))}</span>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3 p-4 bg-gray-50 border-t border-gray-100">
          <button
            onClick={onReject}
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-red-600 bg-red-50 border border-red-200 rounded-xl font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <X size={18} />
            Recusar
          </button>
          <button
            onClick={onAccept}
            disabled={isLoading}
            className="flex-1 px-4 py-3 text-white bg-emerald-600 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Check size={18} />
            {isLoading ? 'Aceitando...' : 'Aceitar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function PedidoCard({ pedido, isSelected, onClick }: { pedido: Pedido; isSelected: boolean; onClick: () => void }) {
  const status = statusConfig[pedido.status]
  const pagamento = pagamentoConfig[pedido.forma_pagamento] || pagamentoConfig.dinheiro
  const pago = isPago(pedido)

  return (
    <div 
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      role="button"
      tabIndex={0}
      className={`
        px-4 py-3 cursor-pointer transition-all border-b border-gray-100 outline-none focus:ring-2 focus:ring-slate-500 focus:ring-inset
        ${isSelected 
          ? 'bg-slate-50 border-l-4 border-l-slate-600' 
          : 'bg-white hover:bg-gray-50'
        }
      `}
    >
      <div className="flex-1 min-w-0">
          {/* Top row: Nome + Hora */}
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className="font-semibold text-gray-900 truncate">
              {pedido.cliente_nome || 'Cliente não informado'}
            </span>
            <span className="text-xs text-gray-500 shrink-0">
              {formatTime(pedido.created_at)}
            </span>
          </div>

          {/* Número do pedido + Badge */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm text-gray-600">Pedido #{pedido.numero_pedido}</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${status.bgColor} ${status.color}`}>
              {status.label}
            </span>
          </div>

          {/* Endereço */}
          {pedido.endereco_entrega && (
            <p className="text-sm text-gray-500 truncate mb-1">
              {pedido.endereco_entrega}
            </p>
          )}

          {/* Bottom row: Pagamento + Total */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{pagamento.shortLabel}</span>
              <span className={`text-xs font-medium ${pago ? 'text-emerald-600' : 'text-amber-600'}`}>
                • {pago ? 'Pago' : 'A pagar'}
              </span>
            </div>
            <span className="text-sm font-bold text-slate-700">
              {formatCurrency(Number(pedido.total))}
            </span>
        </div>
      </div>
    </div>
  )
}

function PedidoDetalhes({ pedidoId, onPrint }: { pedidoId: string; onPrint: (pedido: Pedido) => void }) {
  const { data: pedido, isLoading } = usePedido(pedidoId)
  const updateStatus = useUpdatePedidoStatus()
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    status: StatusPedido | null
  }>({ isOpen: false, status: null })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500"></div>
      </div>
    )
  }

  if (!pedido) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 text-gray-400">
        Pedido não encontrado
      </div>
    )
  }

  const status = statusConfig[pedido.status]
  const StatusIcon = status.icon
  const pagamento = pagamentoConfig[pedido.forma_pagamento] || pagamentoConfig.dinheiro
  const PagamentoIcon = pagamento.icon
  const pago = isPago(pedido)

  const handleStatusClick = (newStatus: StatusPedido) => {
    if (newStatus === pedido.status) return
    setConfirmModal({ isOpen: true, status: newStatus })
  }

  const handleConfirmStatus = async () => {
    if (!confirmModal.status) return
    try {
      await updateStatus.mutateAsync({ id: pedido.id, status: confirmModal.status })
      toast.success(`Status alterado para "${statusConfig[confirmModal.status].label}"`)
      setConfirmModal({ isOpen: false, status: null })
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  const getModalVariant = (status: StatusPedido | null) => {
    if (status === 'cancelado') return 'danger'
    if (status === 'entregue') return 'success'
    return 'default'
  }

  return (
    <>
      <div className="h-full flex flex-col bg-gray-50">
        {/* Content scrollável */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Header Card */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Pedido #{pedido.numero_pedido}</h2>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <Calendar size={14} />
                  {formatFullDate(pedido.created_at)}
                </p>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${status.bgColor} ${status.color}`}>
                <StatusIcon size={16} />
                {status.label}
              </div>
            </div>
          </div>

          {/* Cliente */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cliente</h3>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                <User size={18} className="text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{pedido.cliente_nome || 'Não informado'}</p>
                {pedido.cliente_telefone && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <Phone size={12} />
                    {pedido.cliente_telefone}
                  </p>
                )}
                {pedido.endereco_entrega && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} />
                    {pedido.endereco_entrega}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Itens */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Itens do Pedido</h3>
            <div className="space-y-2">
              {pedido.itens?.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package size={16} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate text-sm">{item.nome_produto}</p>
                    <p className="text-xs text-gray-500">
                      {item.quantidade}x {formatCurrency(Number(item.preco_unitario))}
                    </p>
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">{formatCurrency(Number(item.subtotal))}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-gray-500">Total</span>
              <span className="text-xl font-bold text-slate-700">{formatCurrency(Number(pedido.total))}</span>
            </div>
          </div>

          {/* Pagamento */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Pagamento</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <PagamentoIcon size={18} className="text-gray-600" />
                </div>
                <span className="font-medium text-gray-900">{pagamento.label}</span>
              </div>
              <span className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold ${
                pago 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}>
                {pago ? <Check size={14} /> : <Clock size={14} />}
                {pago ? 'Pago' : 'A pagar'}
              </span>
            </div>
            {pedido.forma_pagamento === 'dinheiro' && pedido.troco_para && (
              <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Troco para</span>
                  <span className="font-medium">{formatCurrency(Number(pedido.troco_para))}</span>
                </div>
                <div className="flex justify-between text-gray-900 font-semibold mt-1">
                  <span>Troco</span>
                  <span>{formatCurrency(Number(pedido.troco_para) - Number(pedido.total))}</span>
                </div>
              </div>
            )}
          </div>

          {/* Observações */}
          {pedido.observacoes && (
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Observações</h3>
              <p className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                {pedido.observacoes}
              </p>
            </div>
          )}

          {/* Alterar Status */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Alterar Status</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(statusConfig).map(([key, config]) => {
                const Icon = config.icon
                const isActive = pedido.status === key
                return (
                  <button
                    key={key}
                    onClick={() => handleStatusClick(key as StatusPedido)}
                    disabled={isActive || updateStatus.isPending}
                    className={`
                      flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all
                      ${isActive 
                        ? `${config.activeBg} ${config.activeText} cursor-default shadow-md` 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }
                    `}
                  >
                    <Icon size={16} />
                    {config.label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer fixo com ações */}
        <div className="px-4 py-3 bg-white border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Pedido #{pedido.numero_pedido}
          </div>
          <button
            onClick={() => onPrint(pedido)}
            className="p-2.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 hover:text-gray-800 transition-colors"
            title="Imprimir Cupom"
          >
            <Printer size={20} />
          </button>
        </div>
      </div>

      {/* Modal de Confirmação */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, status: null })}
        onConfirm={handleConfirmStatus}
        title={`Alterar para "${confirmModal.status ? statusConfig[confirmModal.status].label : ''}"?`}
        message={`Tem certeza que deseja alterar o status do pedido #${pedido.numero_pedido}?`}
        confirmText="Confirmar"
        cancelText="Cancelar"
        variant={getModalVariant(confirmModal.status)}
        isLoading={updateStatus.isPending}
      />
    </>
  )
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
      <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
        <MessageSquare size={40} className="text-gray-400" />
      </div>
      <p className="text-xl font-medium text-gray-600 mb-1">Selecione um pedido</p>
      <p className="text-sm">Escolha um pedido da lista para começar</p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="divide-y divide-gray-100">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="px-4 py-3 bg-white animate-pulse">
          <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 w-24 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 w-full bg-gray-200 rounded mb-2"></div>
          <div className="flex justify-between">
            <div className="h-3 w-16 bg-gray-200 rounded"></div>
            <div className="h-3 w-16 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Pedidos() {
  const [selectedPedidoId, setSelectedPedidoId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<StatusPedido | 'todos'>('todos')
  const [searchQuery, setSearchQuery] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [novoPedidoModal, setNovoPedidoModal] = useState<Pedido | null>(null)
  const [processedPedidos, setProcessedPedidos] = useState<Set<string>>(new Set())
  const { data: pedidos, isLoading } = usePedidos()
  const updateStatus = useUpdatePedidoStatus()

  // Detectar novos pedidos pendentes
  useEffect(() => {
    if (!pedidos) return
    
    const pedidosPendentes = pedidos.filter(p => p.status === 'pendente')
    for (const pedido of pedidosPendentes) {
      if (!processedPedidos.has(pedido.id)) {
        // Novo pedido encontrado!
        setNovoPedidoModal(pedido)
        break
      }
    }
  }, [pedidos, processedPedidos])

  const handleAcceptPedido = async () => {
    if (!novoPedidoModal) return
    try {
      await updateStatus.mutateAsync({ id: novoPedidoModal.id, status: 'preparando' })
      setProcessedPedidos(prev => new Set([...prev, novoPedidoModal.id]))
      setSelectedPedidoId(novoPedidoModal.id)
      toast.success(`Pedido #${novoPedidoModal.numero_pedido} aceito!`)
      setNovoPedidoModal(null)
    } catch {
      toast.error('Erro ao aceitar pedido')
    }
  }

  const handleRejectPedido = async () => {
    if (!novoPedidoModal) return
    try {
      await updateStatus.mutateAsync({ id: novoPedidoModal.id, status: 'cancelado' })
      setProcessedPedidos(prev => new Set([...prev, novoPedidoModal.id]))
      toast.error(`Pedido #${novoPedidoModal.numero_pedido} recusado`)
      setNovoPedidoModal(null)
    } catch {
      toast.error('Erro ao recusar pedido')
    }
  }

  const handlePrint = useCallback((pedido: Pedido) => {
    // Criar janela de impressão
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Não foi possível abrir a janela de impressão')
      return
    }

    const pagamento = pagamentoConfig[pedido.forma_pagamento] || pagamentoConfig.dinheiro
    const pago = isPago(pedido)

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cupom - Pedido #${pedido.numero_pedido}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Courier New', monospace;
            width: 80mm;
            padding: 5mm;
            font-size: 12px;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .item { display: flex; justify-content: space-between; margin: 4px 0; }
          .total { font-size: 14px; font-weight: bold; margin-top: 8px; }
          h1 { font-size: 16px; margin-bottom: 5px; }
          h2 { font-size: 14px; margin: 10px 0 5px; }
          @media print {
            body { width: 80mm; }
          }
        </style>
      </head>
      <body>
        <div class="center">
          <h1>MULTI DELIVERY</h1>
          <p>Pedido #${pedido.numero_pedido}</p>
          <p>${formatFullDate(pedido.created_at)}</p>
        </div>
        
        <div class="divider"></div>
        
        <div>
          <h2>CLIENTE</h2>
          <p class="bold">${pedido.cliente_nome || 'Não informado'}</p>
          ${pedido.cliente_telefone ? `<p>Tel: ${pedido.cliente_telefone}</p>` : ''}
          ${pedido.endereco_entrega ? `<p>${pedido.endereco_entrega}</p>` : ''}
        </div>
        
        <div class="divider"></div>
        
        <div>
          <h2>ITENS</h2>
          ${pedido.itens?.map(item => `
            <div class="item">
              <span>${item.quantidade}x ${item.nome_produto}</span>
              <span>${formatCurrency(Number(item.subtotal))}</span>
            </div>
          `).join('') || ''}
        </div>
        
        <div class="divider"></div>
        
        <div class="item total">
          <span>TOTAL</span>
          <span>${formatCurrency(Number(pedido.total))}</span>
        </div>
        
        <div class="divider"></div>
        
        <div>
          <h2>PAGAMENTO</h2>
          <p>${pagamento.label} - ${pago ? 'PAGO' : 'A PAGAR'}</p>
          ${pedido.forma_pagamento === 'dinheiro' && pedido.troco_para ? `
            <p>Troco para: ${formatCurrency(Number(pedido.troco_para))}</p>
            <p class="bold">Troco: ${formatCurrency(Number(pedido.troco_para) - Number(pedido.total))}</p>
          ` : ''}
        </div>
        
        ${pedido.observacoes ? `
          <div class="divider"></div>
          <div>
            <h2>OBS</h2>
            <p>${pedido.observacoes}</p>
          </div>
        ` : ''}
        
        <div class="divider"></div>
        
        <div class="center">
          <p>Obrigado pela preferência!</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() { window.close(); }
          }
        </script>
      </body>
      </html>
    `)
    printWindow.document.close()
  }, [])

  const pedidosPorStatus = {
    pendente: pedidos?.filter(p => p.status === 'pendente') || [],
    preparando: pedidos?.filter(p => p.status === 'preparando') || [],
    saiu_entrega: pedidos?.filter(p => p.status === 'saiu_entrega') || [],
    entregue: pedidos?.filter(p => p.status === 'entregue') || [],
    cancelado: pedidos?.filter(p => p.status === 'cancelado') || [],
  }

  // Filtrar pedidos com base no filtro ativo e busca
  const pedidosFiltrados = pedidos?.filter(p => {
    // Filtro por status
    const matchStatus = activeFilter === 'todos' || p.status === activeFilter
    
    // Filtro por busca (número do pedido ou nome do cliente)
    const query = searchQuery.toLowerCase().trim()
    const matchSearch = !query || 
      p.numero_pedido?.toString().includes(query) ||
      p.cliente_nome?.toLowerCase().includes(query)
    
    return matchStatus && matchSearch
  })

  const totalPedidos = pedidos?.length || 0

  // Pedidos do dia (não cancelados)
  const pedidosHoje = pedidos?.filter(p => isToday(p.created_at) && p.status !== 'cancelado') || []
  const totalPedidosHoje = pedidosHoje.length
  const totalVendidoHoje = pedidosHoje.reduce((acc, p) => acc + Number(p.total), 0)

  return (
    <>
      <div className="absolute inset-0 flex bg-gray-100">
        {/* Lista de Pedidos */}
        <div className="w-[400px] bg-white flex flex-col shrink-0 border-r border-gray-200">
          {/* Header da Lista */}
          <div className="p-4 bg-slate-700 text-white">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">Pedidos</h1>
              <span className="text-xs text-slate-400">{totalPedidos} total</span>
            </div>
          </div>

          {/* Busca e Filtros */}
          <div className="p-3 bg-gray-50 border-b border-gray-200 space-y-2">
            {/* Campo de busca */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nº pedido ou cliente..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Dropdown de filtro */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Filter size={14} className="text-gray-500" />
                  {activeFilter === 'todos' ? (
                    <span className="text-gray-700">Todos os status ({totalPedidos})</span>
                  ) : (
                    <span className={`flex items-center gap-1.5 ${statusConfig[activeFilter].color}`}>
                      {(() => {
                        const Icon = statusConfig[activeFilter].icon
                        return <Icon size={14} />
                      })()}
                      {statusConfig[activeFilter].label} ({pedidosPorStatus[activeFilter]?.length || 0})
                    </span>
                  )}
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 max-h-64 overflow-y-auto">
                    <button
                      onClick={() => { setActiveFilter('todos'); setIsFilterOpen(false) }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                        activeFilter === 'todos' ? 'bg-slate-50 text-slate-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <Package size={14} className="text-gray-400" />
                      Todos os status
                      <span className="ml-auto text-xs text-gray-400">{totalPedidos}</span>
                    </button>
                    {Object.entries(statusConfig).map(([status, config]) => {
                      const Icon = config.icon
                      const count = pedidosPorStatus[status as StatusPedido]?.length || 0
                      return (
                        <button
                          key={status}
                          onClick={() => { setActiveFilter(status as StatusPedido); setIsFilterOpen(false) }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                            activeFilter === status ? `${config.bgColor} ${config.color} font-medium` : 'text-gray-700'
                          }`}
                        >
                          <Icon size={14} className={activeFilter === status ? '' : 'text-gray-400'} />
                          {config.label}
                          <span className={`ml-auto text-xs ${activeFilter === status ? '' : 'text-gray-400'}`}>{count}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <LoadingSkeleton />
            ) : pedidosFiltrados?.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Package size={40} className="mx-auto mb-3 opacity-50" />
                <p>Nenhum pedido encontrado</p>
              </div>
            ) : (
              pedidosFiltrados?.map((pedido) => (
                <PedidoCard
                  key={pedido.id}
                  pedido={pedido}
                  isSelected={selectedPedidoId === pedido.id}
                  onClick={() => setSelectedPedidoId(pedido.id)}
                />
              ))
            )}
          </div>

          {/* Footer fixo com resumo do dia */}
          <div className="p-3 bg-gray-100 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-gray-500" />
                <span className="text-sm">
                  <span className="font-bold text-lg text-gray-800">{totalPedidosHoje}</span>
                  <span className="text-gray-500 ml-1">hoje</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Banknote size={16} className="text-emerald-600" />
                <span className="text-sm">
                  <span className="font-bold text-lg text-emerald-600">{formatCurrency(totalVendidoHoje)}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detalhes do Pedido */}
        <div className="flex-1">
          {selectedPedidoId ? (
            <PedidoDetalhes pedidoId={selectedPedidoId} onPrint={handlePrint} />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {/* Modal de Novo Pedido */}
      {novoPedidoModal && (
        <NovoPedidoModal
          pedido={novoPedidoModal}
          onAccept={handleAcceptPedido}
          onReject={handleRejectPedido}
          isLoading={updateStatus.isPending}
        />
      )}
    </>
  )
}
