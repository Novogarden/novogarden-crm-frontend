import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { Upload, FileText, Trash2, Eye, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const TYPE_LABELS = {
  FACTURE: { label: 'Facture', color: 'bg-green-100 text-green-700' },
  CONTRAT: { label: 'Contrat', color: 'bg-blue-100 text-blue-700' },
  DEVIS:   { label: 'Devis',   color: 'bg-purple-100 text-purple-700' },
  AUTRE:   { label: 'Autre',   color: 'bg-gray-100 text-gray-600' },
}

const PACK_LABELS = { SOLO: 'Pack Solo (1 tonte)', ESSENTIEL: 'Pack Essentiel (5 tontes)', SERENITE: 'Pack Sérénité (10 tontes)' }

function ExtractedField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1">{label}</label>
      <input
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        className="input w-full text-sm"
        placeholder="—"
      />
    </div>
  )
}

function UploadModal({ onClose, onSuccess }) {
  const [file, setFile] = useState(null)
  const [parsing, setParsing] = useState(false)
  const [extracted, setExtracted] = useState(null)
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
      const res = await api.post('/documents/parse', fd)
      setExtracted(res.data)
    } catch (e) {
      setError('Impossible de lire ce fichier.')
      setExtracted({ type: 'AUTRE', clientNom: '', montant: '', date: '', pack: '', surface: '', reference: '', notes: '' })
    } finally {
      setParsing(false)
    }
  }

  async function handleSave() {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('data', JSON.stringify(extracted))
    await api.post('/documents', fd)
    qc.invalidateQueries(['documents'])
    onSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Importer un document</h2>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Zone upload */}
          {!file ? (
            <div
              onClick={() => fileRef.current.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) }}
              className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors"
            >
              <Upload size={32} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-600">Glissez votre PDF ou image ici</p>
              <p className="text-xs text-gray-400 mt-1">Facture, contrat, devis — PDF, JPG, PNG</p>
              <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                onChange={e => handleFile(e.target.files[0])} />
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <FileText size={20} className="text-brand-600" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} Ko</p>
              </div>
              <button onClick={() => { setFile(null); setExtracted(null) }}>
                <X size={16} className="text-gray-400" />
              </button>
            </div>
          )}

          {/* Parsing */}
          {parsing && (
            <div className="flex items-center gap-2 text-sm text-brand-600">
              <Loader2 size={16} className="animate-spin" />
              Analyse du document en cours…
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* Données extraites */}
          {extracted && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-brand-700 bg-brand-50 p-2 rounded-lg">
                <CheckCircle size={14} /> Informations reconnues — vérifiez et corrigez si besoin
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Type</label>
                  <select value={extracted.type} onChange={e => setExtracted({...extracted, type: e.target.value})} className="input w-full text-sm">
                    {Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <ExtractedField label="Référence" value={extracted.reference} onChange={v => setExtracted({...extracted, reference: v})} />
                <ExtractedField label="Nom client" value={extracted.clientNom} onChange={v => setExtracted({...extracted, clientNom: v})} />
                <ExtractedField label="Date" value={extracted.date} onChange={v => setExtracted({...extracted, date: v})} />
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Pack</label>
                  <select value={extracted.pack || ''} onChange={e => setExtracted({...extracted, pack: e.target.value})} className="input w-full text-sm">
                    <option value="">— Aucun —</option>
                    {Object.entries(PACK_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <ExtractedField label="Montant (€)" value={extracted.montant} onChange={v => setExtracted({...extracted, montant: v})} />
                <ExtractedField label="Surface (m²)" value={extracted.surface} onChange={v => setExtracted({...extracted, surface: v})} />
                <ExtractedField label="Adresse chantier" value={extracted.adresse} onChange={v => setExtracted({...extracted, adresse: v})} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Notes</label>
                <textarea value={extracted.notes || ''} onChange={e => setExtracted({...extracted, notes: e.target.value})}
                  className="input w-full text-sm" rows={2} placeholder="Notes supplémentaires…" />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 border-t border-gray-100">
          <button onClick={onClose} className="btn-secondary flex-1">Annuler</button>
          <button
            onClick={handleSave}
            disabled={!extracted || parsing}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Documents() {
  const [showModal, setShowModal] = useState(false)
  const [preview, setPreview] = useState(null)
  const qc = useQueryClient()

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.get('/documents').then(r => r.data)
  })

  const deleteMut = useMutation({
    mutationFn: id => api.delete(`/documents/${id}`),
    onSuccess: () => qc.invalidateQueries(['documents'])
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 text-sm">Factures, contrats et devis — reconnaissance automatique</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Upload size={16} /> Importer un document
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(TYPE_LABELS).map(([type, meta]) => {
          const count = docs.filter(d => d.type === type).length
          return (
            <div key={type} className="card text-center">
              <p className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${meta.color}`}>{meta.label}</p>
              <p className="text-3xl font-bold text-gray-900">{count}</p>
            </div>
          )
        })}
      </div>

      {/* Liste */}
      <div className="card">
        {isLoading ? (
          <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" /></div>
        ) : docs.length === 0 ? (
          <div className="text-center py-12">
            <FileText size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">Aucun document importé</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-4 text-sm">
              Importer votre première facture
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {docs.map(doc => (
              <div key={doc.id} className="py-3 flex items-center gap-4">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <FileText size={18} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`badge text-xs ${TYPE_LABELS[doc.type]?.color}`}>
                      {TYPE_LABELS[doc.type]?.label}
                    </span>
                    {doc.reference && <span className="text-xs text-gray-400">#{doc.reference}</span>}
                    {doc.pack && <span className="text-xs text-brand-600 font-medium">{PACK_LABELS[doc.pack]}</span>}
                  </div>
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {doc.clientNom || doc.fileName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {doc.adresse && `${doc.adresse} · `}
                    {doc.surface && `${doc.surface} m² · `}
                    {doc.date && doc.date}
                    {doc.montant && ` · ${doc.montant} €`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreview(doc)}
                    className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    title="Voir"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => deleteMut.mutate(doc.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-300 whitespace-nowrap">
                  {format(new Date(doc.createdAt), 'd MMM', { locale: fr })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal upload */}
      {showModal && <UploadModal onClose={() => setShowModal(false)} onSuccess={() => {}} />}

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Détails du document</h2>
              <button onClick={() => setPreview(null)}><X size={20} className="text-gray-400" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Type</span><span className={`badge ${TYPE_LABELS[preview.type]?.color}`}>{TYPE_LABELS[preview.type]?.label}</span></div>
              {preview.reference && <div className="flex justify-between"><span className="text-gray-500">Référence</span><span className="font-medium">#{preview.reference}</span></div>}
              {preview.clientNom && <div className="flex justify-between"><span className="text-gray-500">Client</span><span className="font-medium">{preview.clientNom}</span></div>}
              {preview.adresse && <div className="flex justify-between"><span className="text-gray-500">Adresse</span><span className="font-medium text-right max-w-48">{preview.adresse}</span></div>}
              {preview.pack && <div className="flex justify-between"><span className="text-gray-500">Pack</span><span className="font-medium text-brand-600">{PACK_LABELS[preview.pack]}</span></div>}
              {preview.surface && <div className="flex justify-between"><span className="text-gray-500">Surface</span><span className="font-medium">{preview.surface} m²</span></div>}
              {preview.montant && <div className="flex justify-between"><span className="text-gray-500">Montant</span><span className="font-bold text-brand-700">{preview.montant} €</span></div>}
              {preview.date && <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-medium">{preview.date}</span></div>}
              {preview.notes && <div className="border-t pt-2 mt-2"><p className="text-gray-500 mb-1">Notes</p><p className="text-gray-700">{preview.notes}</p></div>}
            </div>
            <button onClick={() => setPreview(null)} className="btn-secondary w-full mt-4">Fermer</button>
          </div>
        </div>
      )}
    </div>
  )
}
