import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const RESEAU_CONFIG = {
  instagram: { label: 'Instagram', color: '#E1306C', icon: '📷' },
  facebook: { label: 'Facebook', color: '#1877F2', icon: '📘' },
  linkedin: { label: 'LinkedIn', color: '#0A66C2', icon: '💼' }
}

export default function Social() {
  const queryClient = useQueryClient()
  const { data: stats = [], isLoading } = useQuery({
    queryKey: ['socialStats'],
    queryFn: () => api.get('/social/stats').then(r => r.data)
  })

  const syncInstagram = useMutation({
    mutationFn: () => api.post('/social/sync/instagram'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['socialStats'] })
  })
  const syncFacebook = useMutation({
    mutationFn: () => api.post('/social/sync/facebook'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['socialStats'] })
  })
  const syncLinkedin = useMutation({
    mutationFn: () => api.post('/social/sync/linkedin'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['socialStats'] })
  })

  const syncs = { instagram: syncInstagram, facebook: syncFacebook, linkedin: syncLinkedin }

  // Dernier stat par réseau
  const latest = {}
  stats.forEach(s => {
    if (!latest[s.reseau] || new Date(s.date) > new Date(latest[s.reseau].date)) {
      latest[s.reseau] = s
    }
  })

  // Données graphique abonnés par réseau
  const abonnesData = stats
    .filter(s => s.reseau === 'instagram')
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-30)
    .map(s => ({
      date: format(new Date(s.date), 'd MMM', { locale: fr }),
      Instagram: s.abonnes,
    }))

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Réseaux sociaux</h1>

      {/* Cards par réseau */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Object.entries(RESEAU_CONFIG).map(([reseau, config]) => {
          const s = latest[reseau]
          const sync = syncs[reseau]
          return (
            <div key={reseau} className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{config.icon}</span>
                  <h3 className="font-semibold text-gray-800">{config.label}</h3>
                </div>
                <button
                  onClick={() => sync.mutate()}
                  disabled={sync.isPending}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Actualiser"
                >
                  <RefreshCw size={14} className={sync.isPending ? 'animate-spin' : ''} />
                </button>
              </div>

              {s ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-2xl font-bold" style={{ color: config.color }}>
                      {s.abonnes?.toLocaleString('fr-FR')}
                    </p>
                    <p className="text-xs text-gray-500">Abonnés</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-700">{s.vues?.toLocaleString('fr-FR')}</p>
                    <p className="text-xs text-gray-500">Impressions</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-700">{s.likes?.toLocaleString('fr-FR')}</p>
                    <p className="text-xs text-gray-500">Likes</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-gray-700">{s.reach?.toLocaleString('fr-FR')}</p>
                    <p className="text-xs text-gray-500">Portée</p>
                  </div>
                  <p className="text-xs text-gray-400 col-span-2">
                    Mis à jour {format(new Date(s.date), 'd MMM HH:mm', { locale: fr })}
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm mb-2">Non connecté</p>
                  <button
                    onClick={() => sync.mutate()}
                    className="text-xs btn-secondary"
                  >
                    Connecter & synchroniser
                  </button>
                  <p className="text-xs text-gray-300 mt-2">Configurez les tokens API dans Paramètres</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Graphique évolution */}
      {abonnesData.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Évolution abonnés Instagram</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={abonnesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="Instagram" stroke="#E1306C" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
