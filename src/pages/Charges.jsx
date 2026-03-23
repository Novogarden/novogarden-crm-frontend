import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { Upload, Receipt, Trash2, X, Loader2, CheckCircle, AlertCircle, TrendingDown } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const CATEGORIES = {
  CARBURANT:    { label: 'Carburant',     icon: '⛽', color: 'bg-orange-100 text-orange-700' },
  MATERIEL:     { label: 'Matériel',      icon: '🤖', color: 'bg-blue-100 text-blue-700' },
  ASSURANCE:    { label: 'Assurance',     icon: '🛡️', color: 'bg-purple-100 text-purple-700' },
  TELEPHONE:    { label: 'Tél/Internet',  icon: '📱', color: 'bg-cyan-100 text-cyan-700' },
  MARKETING:    { label: 'Marketing',     icon: '📣', color: 'bg-pink-100 text-pink-700' },
  TRANSPORT:    { label: 'Transport',     icon: '🚐', color: 'bg-yellow-100 text-yellow-700' },
  FOURNITURES:  { label: 'Fournitures',   icon: '🖊️', color: 'bg-gray-100 text-gray-700' },
  DIVERS:       { label: 'Divers',        icon: '📦', color: 'bg-slate-100 text-slate-700' },
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} className="input w-full text-sm" placeholder="—" />
    </div>
  )
}

function UploadModal({ onClose }) {
  const [file, setFile] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const fileRef = useRef()
  const qc = useQueryClient()

  async function handleFile(f) {
    if (!f) return
    setFile(f)
    setParsing(true)
    setError(null)
    try {
      const fd = new FormData()
      fd.append('file', f)
      const res = await api.post('/charges/parse', fd)
      setData(res.data)
    } catch {
      setError('Lecture impossible — renseignez les champs manuellement.')
      setData({ fournisseur: '', categorie: 'DIVERS', montantHT: '', montantTTC: '', tva: '', date: '', reference: '', notes: '' })
    } finally {
      setParsing(false)
    }
  }

  async function handleSave() {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('data', JSON.stringify(data))
    await api.post('/charges', fd)
    qc.invalidateQueries(['charges'])
    qc.invalidateQueries(['charges-stats'])
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-bold text-gray-900">Ajouter une charge</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Zone drop */}
          {!file ? (
            <div
              onClick={() => fileRef.current.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors"
            >
              <Upload size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-medium text-gray-600">Déposez votre facture ici</p>
              <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG — max 8 Mo</p>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                onChange={e => handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <Receipt size={18} className="text-brand-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} Ko</p>
              </div>
              <button onClick={() => { setFile(null); setData(null) }}><X size={16} className="text-gray-400" /></button>
            </div>
          )}

          {parsing && (
            <div className="flex items-center gap-2 text-sm text-brand-600">
              <Loader2 size={15} className="animate-spin" /> Analyse en cours…
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {data && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-brand-700 bg-brand-50 p-2 rounded-lg">
                <CheckCircle size={13} /> Informations reconnues — vérifiez avant d'enregistrer
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Catégorie</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {Object.entries(CATEGORIES).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setData({...data, categorie: k})}
                      className={`p-2 rounded-lg text-xs text-center border transition-all ${
                        data.categorie === k
                          ? 'border-brand-400 bg-brand-50 text-brand-700 font-medium'
                          : 'border-gray-100 hover:border-gray-300 text-gray-500'
                      }`}
                    >
                      <div className="text-base">{v.icon}</div>
                      <div className="leading-tight mt-0.5">{v.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Fournisseur" value={data.fournisseur} onChange={v => setData({...data, fournisseur: v})} />
                <Field label="Date" value={data.date} onChange={v => setData({...data, date: v})} />
                <Field label="Montant HT (€)" value={data.montantHT} onChange={v => setData({...data, montantHT: v})} />
                <Field label="Montant TTC (€)" value={data.montantTTC} onChange={v => setData({...data, montantTTC: v})} />
                <Field label="TVA (€)" value={data.tva} onChange={v => setData({...data, tva: v})} />
                <Field label="Référence" value={data.reference} onChange={v => setData({...data, reference: v})} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Notes</label>
                <textarea value={data.notes || ''} onChange={e => setData({...data, notes: e.target.value})}
                  className="input w-full text-sm" rows={2} placeholder="Notes…" />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button onClick={handleSave} disabled={!data || parsing} className="btn-primary flex-1 disabled:opacity-50">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Charges() {
  const [showModal, setShowModal] = useState(false)
  const [filtre, setFiltre] = useState('TOUT')
  const qc = useQueryClient()

  const { data: charges = [], isLoading } = useQuery({
    queryKey: ['charges'],
    queryFn: () => api.get('/charges').then(r => r.data)
  })

  const { data: stats } = useQuery({
    queryKey: ['charges-stats'],
    queryFn: () => api.get('/charges/stats').then(r => r.data)
  })

  const deleteMut = useMutation({
    mutationFn: id => api.delete(`/charges/${id}`),
    onSuccess: () => { qc.invalidateQueries(['charges']); qc.invalidateQueries(['charges-stats']) }
  })

  const filtered = filtre === 'TOUT' ? charges : charges.filter(c => c.categorie === filtre)
  const totalFiltre = filtered.reduce((s, c) => s + (c.montantTTC || 0), 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Charges</h1>
          <p className="text-gray-500 text-sm">Factures fournisseurs — reconnaissance automatique</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Upload size={16} /> Ajouter une facture
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-xs text-gray-400 mb-1">Total TTC</p>
          <p className="text-2xl font-bold text-gray-900">{(stats?.totalTTC || 0).toLocaleString('fr-FR', {minimumFractionDigits:2})} €</p>
          <p className="text-xs text-gray-400">{stats?.count || 0} facture(s)</p>
        </div>
        {['CARBURANT','MATERIEL','ASSURANCE'].map(cat => (
          <div key={cat} className="card text-center">
            <p className="text-xs text-gray-400 mb-1">{CATEGORIES[cat].icon} {CATEGORIES[cat].label}</p>
            <p className="text-xl font-bold text-gray-900">{(stats?.parCategorie?.[cat] || 0).toLocaleString('fr-FR', {minimumFractionDigits:2})} €</p>
          </div>
        ))}
      </div>

      {/* Filtres catégorie */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFiltre('TOUT')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filtre === 'TOUT' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          Tout ({charges.length})
        </button>
        {Object.entries(CATEGORIES).map(([k, v]) => {
          const n = charges.filter(c => c.categorie === k).length
          if (!n) return null
          return (
            <button key={k} onClick={() => setFiltre(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filtre === k ? 'bg-gray-900 text-white' : `${v.color} hover:opacity-80`}`}>
              {v.icon} {v.label} ({n})
            </button>
          )
        })}
      </div>

      {/* Liste */}
      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <TrendingDown size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">Aucune charge enregistrée</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4 text-sm">
              Ajouter votre première facture
            </button>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-50">
              {filtered.map(c => {
                const cat = CATEGORIES[c.categorie] || CATEGORIES.DIVERS
                return (
                  <div key={c.id} className="py-3 flex items-center gap-3">
                    <div className={`p-2 rounded-lg text-base ${cat.color}`}>{cat.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`badge text-xs ${cat.color}`}>{cat.label}</span>
                        {c.reference && <span className="text-xs text-gray-400">#{c.reference}</span>}
                      </div>
                      <p className="text-sm font-medium text-gray-800 truncate mt-0.5">{c.fournisseur || c.fileName}</p>
                      <p className="text-xs text-gray-400">{c.date && `${c.date} · `}{c.notes}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{c.montantTTC ? `${parseFloat(c.montantTTC).toLocaleString('fr-FR', {minimumFractionDigits:2})} €` : '—'}</p>
                      {c.montantHT && c.montantHT !== c.montantTTC && (
                        <p className="text-xs text-gray-400">HT: {parseFloat(c.montantHT).toLocaleString('fr-FR', {minimumFractionDigits:2})} €</p>
                      )}
                    </div>
                    <button onClick={() => deleteMut.mutate(c.id)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-1">
                      <Trash2 size={15} />
                    </button>
                    <p className="text-xs text-gray-300 whitespace-nowrap w-12 text-right">
                      {format(new Date(c.createdAt), 'd MMM', { locale: fr })}
                    </p>
                  </div>
                )
              })}
            </div>
            {filtered.length > 0 && (
              <div className="border-t border-gray-100 pt-3 mt-2 flex justify-between items-center">
                <span className="text-sm text-gray-500">{filtered.length} charge(s) affichée(s)</span>
                <span className="text-sm font-bold text-gray-900">Total : {totalFiltre.toLocaleString('fr-FR', {minimumFractionDigits:2})} €</span>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && <UploadModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
