import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { Search, Euro, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const ETAPE_CONFIG = {
  CONTACT: { label: 'Contact', color: 'bg-gray-100 text-gray-600' },
  DEVIS_EN_COURS: { label: 'Devis en cours', color: 'bg-blue-100 text-blue-700' },
  DEVIS_ENVOYE: { label: 'Devis envoyé', color: 'bg-indigo-100 text-indigo-700' },
  DEVIS_ACCEPTE: { label: 'Devis accepté', color: 'bg-teal-100 text-teal-700' },
  DEVIS_REFUSE: { label: 'Refusé', color: 'bg-red-100 text-red-600' },
  RDV_PLANIFIE: { label: 'RDV planifié', color: 'bg-purple-100 text-purple-700' },
  TRAVAUX_EN_COURS: { label: 'Travaux', color: 'bg-orange-100 text-orange-700' },
  FACTURE_EMISE: { label: 'Facturé', color: 'bg-yellow-100 text-yellow-700' },
  PAYE: { label: 'Payé', color: 'bg-green-100 text-green-700' },
  ARCHIVE: { label: 'Archivé', color: 'bg-gray-100 text-gray-400' }
}

export default function Affaires() {
  const [search, setSearch] = useState('')
  const [etapeFilter, setEtapeFilter] = useState('')

  const { data: affaires = [], isLoading } = useQuery({
    queryKey: ['affaires', search, etapeFilter],
    queryFn: () => api.get('/affaires', { params: { search: search || undefined, etape: etapeFilter || undefined } }).then(r => r.data)
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Affaires</h1>
          <p className="text-gray-500 text-sm">{affaires.length} affaire{affaires.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Rechercher..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400"
          />
        </div>
        <select
          value={etapeFilter} onChange={e => setEtapeFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">Toutes les étapes</option>
          {Object.entries(ETAPE_CONFIG).map(([val, { label }]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" />
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {affaires.map(affaire => {
              const etape = ETAPE_CONFIG[affaire.etape] || ETAPE_CONFIG.CONTACT
              return (
                <div key={affaire.id} className="py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-gray-800 text-sm truncate">{affaire.titre}</p>
                      <span className={`badge ${etape.color} shrink-0`}>{etape.label}</span>
                    </div>
                    <p className="text-xs text-gray-400">{affaire.client?.nom} · {format(new Date(affaire.createdAt), 'd MMM yyyy', { locale: fr })}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {affaire.montantDevis && (
                      <span className="flex items-center gap-1 text-sm text-brand-600 font-medium">
                        <Euro size={12} />{affaire.montantDevis.toLocaleString('fr-FR')} €
                      </span>
                    )}
                    {affaire.dateRdv && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar size={12} />{format(new Date(affaire.dateRdv), 'd MMM', { locale: fr })}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
            {affaires.length === 0 && (
              <p className="text-gray-400 text-sm py-8 text-center">Aucune affaire trouvée</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
