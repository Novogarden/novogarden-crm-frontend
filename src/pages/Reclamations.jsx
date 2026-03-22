import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const STATUT_CONFIG = {
  OUVERTE: { label: 'Ouverte', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  EN_COURS: { label: 'En cours', color: 'bg-orange-100 text-orange-700', icon: Clock },
  RESOLUE: { label: 'Résolue', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  FERMEE: { label: 'Fermée', color: 'bg-gray-100 text-gray-600', icon: XCircle }
}

export default function Reclamations() {
  const queryClient = useQueryClient()
  const { data: reclamations = [], isLoading } = useQuery({
    queryKey: ['reclamations'],
    queryFn: () => api.get('/reclamations').then(r => r.data)
  })

  const updateStatut = useMutation({
    mutationFn: ({ id, statut }) => api.patch(`/reclamations/${id}/statut`, { statut }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reclamations'] })
  })

  if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" /></div>

  const ouvertes = reclamations.filter(r => r.statut === 'OUVERTE').length
  const enCours = reclamations.filter(r => r.statut === 'EN_COURS').length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Réclamations</h1>
          <p className="text-gray-500 text-sm">{ouvertes} ouverte{ouvertes !== 1 ? 's' : ''}, {enCours} en cours</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {Object.entries(STATUT_CONFIG).map(([statut, config]) => {
          const count = reclamations.filter(r => r.statut === statut).length
          const Icon = config.icon
          return (
            <div key={statut} className="card flex items-center gap-3">
              <Icon size={20} className={config.color.split(' ')[1]} />
              <div>
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs text-gray-500">{config.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <div className="divide-y divide-gray-50">
          {reclamations.length === 0 && (
            <p className="text-gray-400 text-sm py-8 text-center">Aucune réclamation</p>
          )}
          {reclamations.map(rec => {
            const config = STATUT_CONFIG[rec.statut]
            const Icon = config.icon
            return (
              <div key={rec.id} className="py-4 flex items-start gap-4">
                <Icon size={18} className={config.color.split(' ')[1]} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-gray-800 text-sm">{rec.objet}</p>
                    <span className={`badge ${config.color}`}>{config.label}</span>
                  </div>
                  <p className="text-xs text-gray-500">{rec.clientNom} {rec.clientEmail ? `· ${rec.clientEmail}` : ''}</p>
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{rec.description}</p>
                  {rec.affaire && (
                    <p className="text-xs text-blue-500 mt-1">Affaire : {rec.affaire.titre}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-xs text-gray-400">
                    {format(new Date(rec.createdAt), 'd MMM yyyy', { locale: fr })}
                  </p>
                  {rec.statut === 'OUVERTE' && (
                    <button
                      onClick={() => updateStatut.mutate({ id: rec.id, statut: 'EN_COURS' })}
                      className="text-xs bg-orange-50 text-orange-600 hover:bg-orange-100 px-2 py-1 rounded transition-colors"
                    >
                      Prendre en charge
                    </button>
                  )}
                  {rec.statut === 'EN_COURS' && (
                    <button
                      onClick={() => updateStatut.mutate({ id: rec.id, statut: 'RESOLUE' })}
                      className="text-xs bg-green-50 text-green-600 hover:bg-green-100 px-2 py-1 rounded transition-colors"
                    >
                      Marquer résolue
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
