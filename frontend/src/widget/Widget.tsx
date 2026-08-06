import { useState, useEffect } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { ChatWindow } from './ChatWindow'
import { widgetStrings } from './i18n'

interface Props {
  businessId: string
  primaryColor?: string
  welcomeMessage?: string
  botName?: string
  apiBaseUrl?: string
}

const DEFAULT_API_BASE_URL = 'http://localhost:8000'
const DEFAULT_WELCOME_MESSAGE = 'Hi! How can I help you today?'

// Browser locales don't always match our 2-letter codes 1:1 -- Norwegian in
// particular reports as "nb" (Bokmål) or "nn" (Nynorsk), never "no".
const LOCALE_ALIASES: Record<string, string> = { nb: 'no', nn: 'no' }

function detectVisitorLanguage(enabledLanguages: string[]): string | null {
  if (typeof navigator === 'undefined' || enabledLanguages.length === 0) return null
  const candidates = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]
  for (const raw of candidates) {
    if (!raw) continue
    const code = raw.split('-')[0].toLowerCase()
    const normalized = LOCALE_ALIASES[code] ?? code
    if (enabledLanguages.includes(normalized)) return normalized
  }
  return null
}

export function Widget({
  businessId,
  primaryColor = '#ff6b00',
  welcomeMessage,
  botName = 'Support Chat',
  apiBaseUrl = DEFAULT_API_BASE_URL,
}: Props) {
  const [open, setOpen] = useState(false)
  const [fetchedWelcomeMessage, setFetchedWelcomeMessage] = useState<string | null>(null)
  const [fetchedPrimaryColor, setFetchedPrimaryColor] = useState<string | null>(null)
  const [resolvedLang, setResolvedLang] = useState<string>('en')

  useEffect(() => {
    let cancelled = false
    fetch(`${apiBaseUrl}/api/businesses/${businessId}/public-settings`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return
        if (data?.welcome_messages) {
          const languages: string[] = data.languages ?? []
          const detected = detectVisitorLanguage(languages)
          const primaryLanguage = languages[0]
          const lang = detected ?? primaryLanguage ?? 'en'
          setResolvedLang(lang)
          const resolved = data.welcome_messages[lang] || data.welcome_message
          if (resolved) setFetchedWelcomeMessage(resolved)
        } else if (data?.welcome_message) {
          setFetchedWelcomeMessage(data.welcome_message)
        }
        if (data?.primary_color) setFetchedPrimaryColor(data.primary_color)
      })
      .catch(() => {
        // Silently keep the default/prop values if this fails — never block
        // the widget from opening over a settings fetch error.
      })
    return () => {
      cancelled = true
    }
  }, [apiBaseUrl, businessId])

  const resolvedWelcomeMessage = fetchedWelcomeMessage ?? welcomeMessage ?? DEFAULT_WELCOME_MESSAGE
  const strings = widgetStrings(resolvedLang)
  // The dashboard-saved color (fetched above) wins over the script tag's data-color, so
  // picking a color in Settings applies to the live widget with no embed-code edits. The
  // data-color attribute still works as a manual override if the fetch fails or is skipped.
  const resolvedPrimaryColor = fetchedPrimaryColor ?? primaryColor

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-3">
      {open && (
        <div className="w-[360px] h-[520px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-4">
          <div className="px-4 py-3 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: resolvedPrimaryColor }}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-white text-sm font-medium">{botName}</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <ChatWindow businessId={businessId} primaryColor={resolvedPrimaryColor} welcomeMessage={resolvedWelcomeMessage} apiBaseUrl={apiBaseUrl} lang={resolvedLang} />
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform"
        style={{ backgroundColor: resolvedPrimaryColor }}
        aria-label={open ? strings.closeChat : strings.openChat}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  )
}
