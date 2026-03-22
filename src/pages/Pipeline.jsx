import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { Euro, Calendar, AlertTriangle, Plus, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const ETAPES = [
  { id: 'CONTACT', label: 'Premier contact', color: 'bg-gray-100 border-gray-300', dot: 'bg-gray-400' },
  { id: 'DEVIS_EN_COURS', label: 'Devis en cours', color: 'bg-blue-50 border-blue-200', dot: 'bg-blue-400' },
  { id: 'DEVIS_ENVOYE', label: 'Devis envoyé', color: 'bg-indigo-50 border-indigo-200', dot: 'bg-indigo-400' },
  { id: 'DEVIS_ACCEPTE', label: 'Devis accepté', color: 'bg-teal-50 border-teal-200', dot: 'bg-teal-500' },
  { id: 'RDV_PLANIFIE', label: 'RDV planifié', color: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500' },
  { id: 'TRAVAUX_EN_COURS', label: 'Travaux en cours', color: 'bg-orange-50 border-orange-200', dot: 'bg-orange-500' },
  { id: 'FACTURE_EMISE', label: 'Facture émise', color: 'bg-yellow-50 border-yellow-200', dot: 'bg-yellow-500' },
  { id: 'PAYE', label: 'Payé ✓', color: 'bg-green-50 border-green-200', dot: 'bg-green-500' },
]

const PRIORITE_COLOR = {
  HAUTE: 'bg-red-100 text-red-700',
  NORMALE: 'bg-gray-100 text-gray-600',
  BASSE: 'bg-blue-100 text-blue-600'
}

function AffaireCard({ affaire, onMoveNext, onMovePrev }) {
  const etapeIndex = ETAPES.findIndex(e => e.id === affaire.etape)
  const hasReclamation = affaire.reclamations?.length > 0

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-800 line-clamp-2 flex-1">{affaire.titre}</p>
        {hasReclamation && <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />}
      </div>
      <p className="text-xs text-gray-500 mb-2">{affaire.client?.nom} {affaire.client?.prenom || ''}</p>

      <div className="flex items-center gap-1.5 flex-wrap">
        {affaire.montantDevis && (
          <span className="flex items-center gap-0.5 text-xs text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded">
            <Euro size={10} />{affaire.montantDevis.toLocaleString('fr-FR')} €
          </span>
        )}
        {affaire.dateRdv && (
          <span className="flex items-center gap-0.5 text-xs text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
            <Calendar size={10} />{format(new Date(affaire.dateRdv), 'd MMM', { locale: fr })}
          </span>
        )}
        <span className={`badge text-xs ${PRIORITE_COLOR[affaire.priorite]}`}>{affaire.priorite}</span>
      </div>

      {/* Boutons avancement */}
      <div className="flex gap-1 mt-3 pt-2 border-t border-gray-50">
        {etapeIndex > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onMovePrev(affaire.id, ETAPES[etapeIndex - 1].id) }}
            className="text-xs text-gray-400 hover:text-gray-600 px-1.5 py-1 rounded hover:bg-gray-50 transition-colors"
          >
            ← Reculer
          </button>
        )}
        {etapeIndex < ETAPES.length - 1 && affaire.etape !== 'DEVIS_REFUSE' && (
          <button
            onClick={(e) => { e.stopPropagation(); onMoveNext(affaire.id, ETAPES[etapeIndex + 1].id) }}
            className="ml-auto flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 px-2 py-1 rounded bg-brand-50 hover:bg-brand-100 transition-colors font-medium"
          >
            Avancer <ChevronRight size={10} />
          </button>
        )}
      </div>
    </div>
  )
}

export default function Pipeline() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['pipeline'],
    queryFn: () => api.get('/affaires/pipeline').then(r => r.data)
  })

  const moveEtape = useMutation({
    mutationFn: ({ id, etape }) => api.patch(`/affaires/${id}/etape`, { etape }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pipeline'] })
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
    </div>
  )

  const pipeline = data?.pipeline || {}
  const stats = data?.stats || {}

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pipeline commercial</h1>
          <p className="text-gray-500 text-sm">De la prise de contact à l'encaissement</p>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Nouvelle affaire
        </button>
      </div>

      {/* Stats pipeline */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="card text-center">
          <p className="text-2xl font-bold text-gray-900">{stats.totalAffaires || 0}</p>
          <p className="text-xs text-gray-500 mt-0.5">Affaires actives</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.montantDevisPotentiel?.toLocaleString('fr-FR') || 0} €</p>
          <p className="text-xs text-gray-500 mt-0.5">CA potentiel</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.montantFacture?.toLocaleString('fr-FR') || 0} €</p>
          <p className="text-xs text-gray-500 mt-0.5">Facturé</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-brand-600">{stats.montantEncaisse?.toLocaleString('fr-FR') || 0} €</p>
          <p className="text-xs text-gray-500 mt-0.5">Encaissé</p>
        </div>
      </div>

      {/* Funnel indicator */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2">
        {ETAPES.map((etape, i) => {
          const count = (pipeline[etape.id] || []).length
          return (
            <div key={etape.id} className="flex items-center gap-1">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap ${etape.color}`}>
                <span className={`w-2 h-2 rounded-full ${etape.dot}`} />
                {etape.label}
                {count > 0 && <span className="bg-white rounded-full px-1.5 py-0.5 font-bold text-gray-700">{count}</span>}
              </div>
              {i < ETAPES.length - 1 && <ChevronRight size={12} className="text-gray-300 shrink-0" />}
            </div>
          )
        })}
      </div>

      {/* Colonnes kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {ETAPES.map(etape => {
          const affaires = pipeline[etape.id] || []
          return (
            <div key={etape.id} className="shrink-0 w-64">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2.5 h-2.5 rounded-full ${etape.dot}`} />
                <h3 className="text-sm font-semibold text-gray-700">{etape.label}</h3>
                <span className="ml-auto bg-gray-100 text-gray-600 text-xs font-medium px-1.5 py-0.5 rounded-full">
                  {affaires.length}
                </span>
              </div>

              <div className="space-y-2 min-h-20">
                {affaires.map(affaire => (
                  <AffaireCard
                    key={affaire.id}
                    affaire={affaire}
                    onMoveNext={(id, newEtape) => moveEtape.mutate({ id, etape: newEtape })}
                    onMovePrev={(id, newEtape) => moveEtape.mutate({ id, etape: newEtape })}
                  />
                ))}
                {affaires.length === 0 && (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg h-16 flex items-center justify-center">
                    <p className="text-xs text-gray-300">Vide</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
