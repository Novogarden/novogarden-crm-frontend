import { useState, useEffect } from 'react'
import { MapPin, Wind, Droplets, Thermometer, AlertTriangle } from 'lucide-react'

const WMO_CODES = {
  0:  { label: 'Ciel dégagé',       icon: '☀️',  travaux: true },
  1:  { label: 'Peu nuageux',        icon: '🌤️',  travaux: true },
  2:  { label: 'Partiellement nuageux', icon: '⛅', travaux: true },
  3:  { label: 'Couvert',            icon: '☁️',  travaux: true },
  45: { label: 'Brouillard',         icon: '🌫️',  travaux: true },
  48: { label: 'Brouillard givrant', icon: '🌫️',  travaux: false },
  51: { label: 'Bruine légère',      icon: '🌦️',  travaux: true },
  53: { label: 'Bruine',             icon: '🌦️',  travaux: true },
  55: { label: 'Bruine forte',       icon: '🌧️',  travaux: false },
  61: { label: 'Pluie légère',       icon: '🌧️',  travaux: true },
  63: { label: 'Pluie modérée',      icon: '🌧️',  travaux: false },
  65: { label: 'Pluie forte',        icon: '🌧️',  travaux: false },
  71: { label: 'Neige légère',       icon: '❄️',  travaux: false },
  73: { label: 'Neige',              icon: '❄️',  travaux: false },
  75: { label: 'Neige forte',        icon: '❄️',  travaux: false },
  77: { label: 'Grésil',             icon: '🌨️',  travaux: false },
  80: { label: 'Averses légères',    icon: '🌦️',  travaux: true },
  81: { label: 'Averses',            icon: '🌧️',  travaux: false },
  82: { label: 'Averses violentes',  icon: '⛈️',  travaux: false },
  85: { label: 'Averses de neige',   icon: '🌨️',  travaux: false },
  86: { label: 'Averses de neige',   icon: '🌨️',  travaux: false },
  95: { label: 'Orage',              icon: '⛈️',  travaux: false },
  96: { label: 'Orage avec grêle',   icon: '⛈️',  travaux: false },
  99: { label: 'Orage fort',         icon: '⛈️',  travaux: false },
}

function getCode(code) {
  return WMO_CODES[code] || { label: 'Inconnu', icon: '🌡️', travaux: true }
}

const JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null)
  const [city, setCity] = useState(() => localStorage.getItem('meteo_ville') || 'Caen')
  const [inputCity, setInputCity] = useState(city)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchWeather(cityName) {
    setLoading(true)
    setError(null)
    try {
      // Géocodage
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=fr&format=json`
      )
      const geoData = await geoRes.json()
      if (!geoData.results?.length) throw new Error(`Ville "${cityName}" introuvable`)

      const { latitude, longitude, name } = geoData.results[0]

      // Météo
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=Europe/Paris&forecast_days=6`
      const wRes = await fetch(url)
      const wData = await wRes.json()

      setWeather({ ...wData, cityName: name })
      localStorage.setItem('meteo_ville', cityName)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWeather(city) }, [city])

  function handleCitySubmit(e) {
    e.preventDefault()
    if (inputCity.trim()) setCity(inputCity.trim())
  }

  if (loading) return (
    <div className="card animate-pulse">
      <div className="h-24 bg-gray-100 rounded-lg" />
    </div>
  )

  if (error) return (
    <div className="card">
      <div className="flex items-center gap-2 text-red-500 mb-3">
        <AlertTriangle size={16} />
        <span className="text-sm">{error}</span>
      </div>
      <form onSubmit={handleCitySubmit} className="flex gap-2">
        <input
          value={inputCity}
          onChange={e => setInputCity(e.target.value)}
          placeholder="Ville..."
          className="input flex-1 text-sm"
        />
        <button type="submit" className="btn-primary text-sm px-3">OK</button>
      </form>
    </div>
  )

  const cur = weather.current
  const daily = weather.daily
  const curCode = getCode(cur.weathercode)
  const canWork = curCode.travaux && cur.windspeed_10m < 50

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-1">
            <MapPin size={12} />
            <form onSubmit={handleCitySubmit} className="flex items-center gap-1">
              <input
                value={inputCity}
                onChange={e => setInputCity(e.target.value)}
                className="text-xs text-gray-500 bg-transparent border-b border-dashed border-gray-300 focus:outline-none w-24"
                title="Changer de ville"
              />
              <button type="submit" className="text-brand-600 text-xs hover:underline">→</button>
            </form>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{curCode.icon}</span>
            <div>
              <p className="text-3xl font-bold text-gray-900">{Math.round(cur.temperature_2m)}°C</p>
              <p className="text-xs text-gray-500">{curCode.label}</p>
            </div>
          </div>
        </div>

        {/* Badge chantier */}
        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
          canWork
            ? 'bg-brand-50 text-brand-700 border border-brand-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {canWork ? '✅ Chantier OK' : '⚠️ Déconseillé'}
        </div>
      </div>

      {/* Infos actuelles */}
      <div className="flex gap-4 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Wind size={12} /> {Math.round(cur.windspeed_10m)} km/h
        </span>
        <span className="flex items-center gap-1">
          <Droplets size={12} /> {cur.relative_humidity_2m}%
        </span>
        <span className="flex items-center gap-1">
          <Thermometer size={12} /> {Math.round(daily.temperature_2m_min[0])}° / {Math.round(daily.temperature_2m_max[0])}°
        </span>
      </div>

      {/* Prévisions 5 jours */}
      <div className="border-t border-gray-100 pt-3">
        <p className="text-xs text-gray-400 mb-2 font-medium">PRÉVISIONS 5 JOURS</p>
        <div className="grid grid-cols-5 gap-1">
          {daily.time.slice(1, 6).map((date, i) => {
            const idx = i + 1
            const d = getCode(daily.weathercode[idx])
            const rain = daily.precipitation_sum[idx]
            const wind = daily.windspeed_10m_max[idx]
            const ok = d.travaux && wind < 50
            return (
              <div key={date} className={`text-center p-1.5 rounded-lg ${ok ? 'bg-gray-50' : 'bg-red-50'}`}>
                <p className="text-xs text-gray-400 font-medium">
                  {JOURS[new Date(date).getDay()]}
                </p>
                <p className="text-xl my-0.5">{d.icon}</p>
                <p className="text-xs font-semibold text-gray-700">
                  {Math.round(daily.temperature_2m_max[idx])}°
                </p>
                <p className="text-xs text-gray-400">
                  {Math.round(daily.temperature_2m_min[idx])}°
                </p>
                {rain > 1 && (
                  <p className="text-xs text-blue-500 mt-0.5">{rain.toFixed(0)}mm</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
