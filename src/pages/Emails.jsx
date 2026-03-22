import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { RefreshCw, Mail, Tag } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const TYPE_CONFIG = {
  DEVIS_DEMANDE: { label: 'Devis demandé', color: 'bg-blue-100 text-blue-700' },
  RDV_DEMANDE: { label: 'RDV demandé', color: 'bg-purple-100 text-purple-700' },
  RECLAMATION: { label: 'Réclamation', color: 'bg-red-100 text-red-700' },
  PAIEMENT: { label: 'Paiement', color: 'bg-green-100 text-green-700' },
  AUTRE: { label: 'Autre', color: 'bg-gray-100 text-gray-600' }
}

export default function Emails() {
  const queryClient = useQueryClient()
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['emailLogs'],
    queryFn: () => api.get('/gmail/logs').then(r => r.data)
  })

  const sync = useMutation({
    mutationFn: () => api.post('/gmail/sync', { maxResults: 50 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emailLogs'] })
  })

  const stats = Object.entries(TYPE_CONFIG).map(([type, config]) => ({
    type, ...config,
    count: logs.filter(l => l.type === type).length
  }))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Emails analysés</h1>
          <p className="text-gray-500 text-sm">{logs.filter(l => !l.traite).length} non traités</p>
        </div>
        <button
          onClick={() => sync.mutate()}
          disabled={sync.isPending}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <RefreshCw size={14} className={sync.isPending ? 'animate-spin' : ''} />
          {sync.isPending ? 'Synchronisation...' : 'Synchroniser Gmail'}
        </button>
      </div>

      {sync.data && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-700">
          ✓ {sync.data.data.newEmails} nouveaux emails · {sync.data.data.affairesCreated} affaires créées
        </div>
      )}

      {/* Stats par type */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {stats.map(s => (
          <div key={s.type} className="card text-center">
            <p className="text-2xl font-bold text-gray-800">{s.count}</p>
            <span className={`badge mt-1 ${s.color}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Liste emails */}
      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Mail size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Aucun email synchronisé.</p>
            <p className="text-gray-400 text-sm">Cliquez sur "Synchroniser Gmail" pour démarrer.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map(log => {
              const typeConfig = TYPE_CONFIG[log.type] || TYPE_CONFIG.AUTRE
              return (
                <div key={log.id} className={`py-3 flex items-start gap-3 ${!log.traite ? 'bg-blue-50/30' : ''}`}>
                  <span className={`badge mt-0.5 shrink-0 ${typeConfig.color}`}>{typeConfig.label}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{log.sujet}</p>
                    <p className="text-xs text-gray-400 truncate">{log.expediteur}</p>
                    {log.snippet && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{log.snippet}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">
                      {format(new Date(log.dateEmail), 'd MMM HH:mm', { locale: fr })}
                    </p>
                    {!log.traite && <span className="text-xs text-blue-500">● Non traité</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
