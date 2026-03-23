import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users, FileText, Euro, TrendingUp, AlertTriangle, Calendar, Mail, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import WeatherWidget from '../components/WeatherWidget'

function KpiCard({ icon: Icon, label, value, sub, color = 'brand', alert }) {
  const colors = {
    brand: 'text-brand-600 bg-brand-50',
    blue: 'text-blue-600 bg-blue-50',
    orange: 'text-orange-600 bg-orange-50',
    red: 'text-red-600 bg-red-50',
    purple: 'text-purple-600 bg-purple-50'
  }
  return (
    <div className="card flex items-start gap-4">
      <div className={`p-2.5 rounded-xl ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-500 text-xs">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {sub && <p className="text-gray-400 text-xs mt-0.5">{sub}</p>}
      </div>
      {alert && (
        <span className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0" />
      )}
    </div>
  )
}

function EmailTypeColor(type) {
  const map = {
    DEVIS_DEMANDE: 'bg-blue-100 text-blue-700',
    RDV_DEMANDE: 'bg-purple-100 text-purple-700',
    RECLAMATION: 'bg-red-100 text-red-700',
    PAIEMENT: 'bg-green-100 text-green-700',
    AUTRE: 'bg-gray-100 text-gray-600'
  }
  return map[type] || map.AUTRE
}

export default function Dashboard() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then(r => r.data)
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
    </div>
  )

  const k = data?.kpis || {}
  const caData = (data?.caParMois || []).map(row => ({
    mois: format(new Date(row.mois), 'MMM', { locale: fr }),
    CA: Number(row.total) || 0
  }))

  const socialByReseau = {}
  ;(data?.socialStats || []).forEach(s => { socialByReseau[s.reseau] = s })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">{format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}</p>
        </div>
        <button onClick={() => refetch()} disabled={isFetching} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Euro} label="CA facturé (30j)" value={`${k.caFactureMois?.toLocaleString('fr-FR')} €`} sub={`Encaissé: ${k.caEncaisseMois?.toLocaleString('fr-FR')} €`} color="brand" />
        <KpiCard icon={FileText} label="Devis en attente" value={k.devisEnAttente || 0} sub="En cours de décision" color="blue" />
        <KpiCard icon={Calendar} label="RDV cette semaine" value={k.rdvSemaine || 0} color="purple" />
        <KpiCard icon={AlertTriangle} label="Réclamations ouvertes" value={k.reclamationsOuvertes || 0} color="red" alert={k.reclamationsOuvertes > 0} />
        <KpiCard icon={Users} label="Total clients" value={k.totalClients || 0} color="blue" />
        <KpiCard icon={FileText} label="Affaires actives" value={k.affairesActives || 0} sub={`+${k.affairesMois || 0} ce mois`} color="brand" />
        <KpiCard icon={TrendingUp} label="Taux conversion devis" value={`${k.tauxConversionDevis || 0}%`} color="brand" />
        <KpiCard icon={Mail} label="Emails non traités" value={k.emailsNonTraites || 0} color="orange" alert={k.emailsNonTraites > 5} />
      </div>

      {/* Météo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WeatherWidget />
        <div className="card flex flex-col justify-between">
          <h2 className="font-semibold text-gray-800 mb-3">Conseil du jour</h2>
          <p className="text-sm text-gray-500 flex-1">
            Vérifiez la météo avant de planifier vos chantiers. Un vent &gt; 50 km/h ou des précipitations importantes peuvent retarder les travaux de taille, plantation ou terrassement.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-gray-500">
            <div className="bg-brand-50 rounded-lg p-2">
              <p className="text-lg">🌱</p>
              <p className="font-medium text-brand-700">Plantation</p>
              <p>10–25°C</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2">
              <p className="text-lg">✂️</p>
              <p className="font-medium text-blue-700">Taille</p>
              <p>Pas de gel</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-2">
              <p className="text-lg">🏗️</p>
              <p className="font-medium text-orange-700">Terrassement</p>
              <p>Sol sec</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Graphique CA */}
        <div className="card lg:col-span-2">
          <h2 className="font-semibold text-gray-800 mb-4">Chiffre d'affaires (12 mois)</h2>
          {caData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={caData}>
                <defs>
                  <linearGradient id="caGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${v}€`} />
                <Tooltip formatter={v => [`${v.toLocaleString('fr-FR')} €`, 'CA']} />
                <Area type="monotone" dataKey="CA" stroke="#16a34a" fill="url(#caGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Pas encore de données</div>
          )}
        </div>

        {/* Réseaux sociaux */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Réseaux sociaux</h2>
          <div className="space-y-3">
            {['instagram', 'facebook', 'linkedin'].map(r => {
              const s = socialByReseau[r]
              const icons = { instagram: '📷', facebook: '📘', linkedin: '💼' }
              return (
                <div key={r} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span>{icons[r]}</span>
                    <span className="text-sm capitalize text-gray-700">{r}</span>
                  </div>
                  {s ? (
                    <div className="text-right">
                      <p className="text-sm font-semibold">{s.abonnes?.toLocaleString('fr-FR')}</p>
                      <p className="text-xs text-gray-400">{s.vues?.toLocaleString('fr-FR')} vues</p>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Non connecté</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Wix stats */}
          {data?.wixStats && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Site Wix (30 derniers jours)</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-brand-600">{data.wixStats.visiteurs?.toLocaleString('fr-FR')}</p>
                  <p className="text-xs text-gray-500">Visiteurs</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-brand-600">{data.wixStats.pageVues?.toLocaleString('fr-FR')}</p>
                  <p className="text-xs text-gray-500">Pages vues</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Derniers emails */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Derniers emails détectés</h2>
        {(data?.recentEmails || []).length === 0 ? (
          <p className="text-gray-400 text-sm">Aucun email synchronisé</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {(data.recentEmails || []).map(email => (
              <div key={email.id} className="py-3 flex items-start gap-3">
                <span className={`badge mt-0.5 ${EmailTypeColor(email.type)}`}>
                  {email.type?.replace('_', ' ') || 'AUTRE'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{email.sujet}</p>
                  <p className="text-xs text-gray-400 truncate">{email.expediteur} · {email.snippet}</p>
                </div>
                <p className="text-xs text-gray-400 whitespace-nowrap">
                  {format(new Date(email.dateEmail), 'd MMM', { locale: fr })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
