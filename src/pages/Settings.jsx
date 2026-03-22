import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react'

function StatusBadge({ connected }) {
  return connected
    ? <span className="flex items-center gap-1 text-green-600 text-sm"><CheckCircle size={14} /> Connecté</span>
    : <span className="flex items-center gap-1 text-gray-400 text-sm"><XCircle size={14} /> Non connecté</span>
}

export default function Settings() {
  const { data: gmailStatus } = useQuery({
    queryKey: ['gmailStatus'],
    queryFn: () => api.get('/gmail/status').then(r => r.data)
  })

  const sections = [
    {
      title: 'Gmail',
      description: 'Analyse automatique des emails entrants pour détecter devis, RDV et réclamations.',
      connected: gmailStatus?.connected,
      action: (
        <a href="/api/auth/google" className="btn-primary text-sm flex items-center gap-2 w-fit">
          <ExternalLink size={14} /> Connecter Gmail
        </a>
      )
    },
    {
      title: 'Wix',
      description: 'Récupération des analytics de votre site (visiteurs, pages vues, sources trafic).',
      connected: !!import.meta.env.VITE_WIX_CONFIGURED,
      envVars: ['WIX_API_KEY', 'WIX_SITE_ID']
    },
    {
      title: 'Instagram & Facebook (Meta)',
      description: 'Stats de vos pages : abonnés, impressions, reach, likes.',
      connected: false,
      envVars: ['META_ACCESS_TOKEN', 'META_APP_ID', 'INSTAGRAM_BUSINESS_ACCOUNT_ID', 'FACEBOOK_PAGE_ID'],
      docsUrl: 'https://developers.facebook.com/docs/graph-api'
    },
    {
      title: 'LinkedIn',
      description: 'Statistiques de votre page entreprise LinkedIn.',
      connected: false,
      envVars: ['LINKEDIN_ACCESS_TOKEN', 'LINKEDIN_CLIENT_ID', 'LINKEDIN_ORG_ID'],
      docsUrl: 'https://learn.microsoft.com/en-us/linkedin/marketing'
    }
  ]

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-2">Paramètres</h1>
      <p className="text-gray-500 text-sm mb-6">Configurez vos intégrations</p>

      <div className="space-y-4">
        {sections.map(section => (
          <div key={section.title} className="card">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-800">{section.title}</h3>
              <StatusBadge connected={section.connected} />
            </div>
            <p className="text-sm text-gray-500 mb-3">{section.description}</p>

            {section.action && !section.connected && section.action}

            {section.envVars && (
              <div className="bg-gray-50 rounded-lg p-3 mt-2">
                <p className="text-xs font-medium text-gray-600 mb-2">Variables d'environnement à configurer sur Railway :</p>
                <div className="space-y-1">
                  {section.envVars.map(v => (
                    <code key={v} className="block text-xs text-gray-500 font-mono">{v}</code>
                  ))}
                </div>
                {section.docsUrl && (
                  <a href={section.docsUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-2">
                    Documentation API <ExternalLink size={10} />
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card mt-4">
        <h3 className="font-semibold text-gray-800 mb-2">Synchronisation automatique</h3>
        <div className="space-y-1 text-sm text-gray-500">
          <p>📧 Gmail — toutes les 30 minutes</p>
          <p>🌐 Wix Analytics — chaque jour à 7h</p>
          <p>📱 Réseaux sociaux — chaque jour à 8h</p>
        </div>
      </div>
    </div>
  )
}
