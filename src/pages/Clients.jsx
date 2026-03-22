import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { Search, Users, Phone, Mail, FileText } from 'lucide-react'

export default function Clients() {
  const [search, setSearch] = useState('')

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => api.get('/clients', { params: search ? { search } : {} }).then(r => r.data)
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 text-sm">{clients.length} client{clients.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text" placeholder="Rechercher un client..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-400"
        />
      </div>

      <div className="card">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-12">
            <Users size={40} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Aucun client trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {clients.map(client => (
              <div key={client.id} className="py-3 flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                  <span className="text-brand-700 font-semibold text-sm">
                    {client.nom.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 text-sm">{client.nom} {client.prenom || ''}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {client.email && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Mail size={10} />{client.email}
                      </span>
                    )}
                    {client.telephone && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Phone size={10} />{client.telephone}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                  <FileText size={12} />
                  {client._count?.affaires || 0} affaire{client._count?.affaires !== 1 ? 's' : ''}
                </div>
                {client.source && (
                  <span className="badge bg-gray-100 text-gray-500">{client.source}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
