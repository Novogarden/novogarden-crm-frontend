import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Leaf } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center mb-4">
            <Leaf size={28} className="text-white" />
          </div>
          <h1 className="text-white text-2xl font-bold">CRM Novogarden</h1>
          <p className="text-gray-400 text-sm mt-1">Connectez-vous à votre espace</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-2xl p-6 space-y-4">
          {error && <p className="text-red-400 text-sm bg-red-900/30 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="text-gray-300 text-sm block mb-1">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-brand-500 focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-gray-300 text-sm block mb-1">Mot de passe</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-brand-500 focus:outline-none text-sm"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
