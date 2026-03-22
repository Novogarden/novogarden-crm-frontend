import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { RefreshCw, Globe, Users, Eye, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function Wix() {
  const queryClient = useQueryClient()
  const { data: stats = [], isLoading } = useQuery({
    queryKey: ['wixStats'],
    queryFn: () => api.get('/wix/stats').then(r => r.data)
  })

  const sync = useMutation({
    mutationFn: () => api.get('/wix/analytics'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wixStats'] })
  })

  const latest = stats[0]
  const chartData = [...stats].reverse().map(s => ({
    date: format(new Date(s.date), 'd MMM', { locale: fr }),
    Visiteurs: s.visiteurs,
    'Pages vues': s.pageVues
  }))

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Site Wix</h1>
          <p className="text-gray-500 text-sm">Analytics et performances</p>
        </div>
        <button onClick={() => sync.mutate()} disabled={sync.isPending} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} className={sync.isPending ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {latest ? (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="card flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl"><Users size={18} className="text-blue-600" /></div>
              <div>
                <p className="text-2xl font-bold">{latest.visiteurs?.toLocaleString('fr-FR')}</p>
                <p className="text-xs text-gray-500">Visiteurs uniques</p>
              </div>
            </div>
            <div className="card flex items-center gap-3">
              <div className="p-2 bg-brand-50 rounded-xl"><Eye size={18} className="text-brand-600" /></div>
              <div>
                <p className="text-2xl font-bold">{latest.pageVues?.toLocaleString('fr-FR')}</p>
                <p className="text-xs text-gray-500">Pages vues</p>
              </div>
            </div>
            <div className="card flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-xl"><Globe size={18} className="text-purple-600" /></div>
              <div>
                <p className="text-2xl font-bold">{latest.sessions?.toLocaleString('fr-FR')}</p>
                <p className="text-xs text-gray-500">Sessions</p>
              </div>
            </div>
            <div className="card flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-xl"><TrendingDown size={18} className="text-red-600" /></div>
              <div>
                <p className="text-2xl font-bold">{latest.tauxRebond ? `${latest.tauxRebond.toFixed(0)}%` : 'N/A'}</p>
                <p className="text-xs text-gray-500">Taux de rebond</p>
              </div>
            </div>
          </div>

          {chartData.length > 1 && (
            <div className="card mb-6">
              <h2 className="font-semibold text-gray-800 mb-4">Évolution du trafic</h2>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="Visiteurs" stroke="#3b82f6" fill="url(#visitGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {latest.sourcesTrafic && (
            <div className="card">
              <h2 className="font-semibold text-gray-800 mb-4">Sources de trafic</h2>
              <div className="space-y-2">
                {Object.entries(latest.sourcesTrafic).map(([source, pct]) => (
                  <div key={source} className="flex items-center gap-3">
                    <p className="text-sm text-gray-600 w-28 capitalize">{source}</p>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="text-sm font-medium text-gray-700 w-8 text-right">{pct}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center py-12">
          <Globe size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400">Aucune donnée Wix disponible.</p>
          <p className="text-gray-400 text-sm mb-4">Configurez votre API Key Wix dans Paramètres.</p>
          <button onClick={() => sync.mutate()} className="btn-primary text-sm">
            Synchroniser maintenant
          </button>
        </div>
      )}
    </div>
  )
}
