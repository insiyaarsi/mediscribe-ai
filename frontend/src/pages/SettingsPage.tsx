import { useEffect, useState, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import { toast } from 'sonner'
import { User, Sliders, Bell, Code, AlertTriangle, Save, Camera } from 'lucide-react'
import { cn } from '../lib/utils'

type SettingsTab = 'profile' | 'preferences' | 'notifications' | 'api' | 'danger'

interface TabItem {
  id:      SettingsTab
  label:   string
  icon:    React.ReactNode
  danger?: boolean
}

const TABS: TabItem[] = [
  { id: 'profile',       label: 'Profile',            icon: <User size={15} />           },
  { id: 'preferences',   label: 'Preferences',        icon: <Sliders size={15} />        },
  { id: 'notifications', label: 'Notifications',      icon: <Bell size={15} />           },
  { id: 'api',           label: 'API & Integrations', icon: <Code size={15} />           },
  { id: 'danger',        label: 'Danger Zone',        icon: <AlertTriangle size={15} />, danger: true },
]

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        'w-[40px] h-[22px] rounded-full relative flex-shrink-0',
        'transition-colors duration-[180ms]',
        value ? 'bg-[#1A56DB]' : 'bg-[#CBD5E0]'
      )}
    >
      <span className={cn(
        'absolute left-[3px] top-[3px] w-[16px] h-[16px] rounded-full bg-white shadow-sm',
        'transition-transform duration-[180ms]',
        value ? 'translate-x-[18px]' : 'translate-x-0'
      )} />
    </button>
  )
}

function SettingRow({
  label, sub, children, dark,
}: {
  label: string; sub?: string; children: React.ReactNode; dark: boolean
}) {
  return (
    <div className={cn(
      'flex items-center justify-between py-[14px] border-b last:border-b-0',
      dark ? 'border-[#334155]' : 'border-[#E2E8F0]'
    )}>
      <div>
        <div className={cn(
          'text-[14px] font-semibold',
          dark ? 'text-[#F1F5F9]' : 'text-[#0D1B2A]'
        )}>
          {label}
        </div>
        {sub && (
          <div className="text-[12.5px] text-[#94A3B8] mt-[2px]">{sub}</div>
        )}
      </div>
      {children}
    </div>
  )
}

function FormField({
  label, type = 'text', value, onChange, placeholder, dark,
}: {
  label: string; type?: string; value: string
  onChange: (v: string) => void; placeholder?: string; dark: boolean
}) {
  return (
    <div>
      <label className={cn(
        'block text-[13px] font-semibold mb-[5px]',
        dark ? 'text-[#E2E8F0]' : 'text-[#0D1B2A]'
      )}>
        {label}
      </label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={cn(
          'w-full px-[13px] py-[9px] border rounded-[10px] text-[14px] font-sans',
          'placeholder:text-[#94A3B8] outline-none focus:border-[#1A56DB] transition-all duration-[180ms]',
          dark
            ? 'bg-[#0F172A] border-[#334155] text-[#E2E8F0] focus:bg-[#0F172A]'
            : 'bg-[#F7FAFC] border-[#E2E8F0] text-[#0D1B2A] focus:bg-white'
        )}
      />
    </div>
  )
}

export default function SettingsPage() {
  const {
    history, clearHistory,
    profile, updateProfile,
    preferences, updatePreferences,
    notifications, updateNotifications,
    resetSettings,
  } = useAppStore()

  const dark = preferences.darkMode

  const [activeTab,        setActiveTab]        = useState<SettingsTab>('profile')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [avatarPreview,    setAvatarPreview]    = useState<string | null>(profile.avatarUrl)

  const [draft, setDraft] = useState({ ...profile })
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateDraft = (field: string, value: string) =>
    setDraft(prev => ({ ...prev, [field]: value }))

  useEffect(() => {
    setDraft({ ...profile })
    setAvatarPreview(profile.avatarUrl)
  }, [profile])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type', { description: 'Please upload a JPG, PNG, WebP or GIF image.' })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large', { description: 'Maximum photo size is 2MB.' })
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const url = ev.target?.result as string
      setAvatarPreview(url)
      setDraft(prev => ({ ...prev, avatarUrl: url }))
    }
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = () => {
    updateProfile(draft)
    toast.success('Profile saved', { description: 'Your changes have been updated.' })
  }

  const initials = `${draft.firstName[0] ?? ''}${draft.lastName[0] ?? ''}`.toUpperCase()

  // ── Shared class fragments ─────────────────────────────
  const panelClass = cn(
    'border rounded-[14px]',
    dark ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
  )
  const cancelBtnClass = cn(
    'px-[16px] py-[8px] rounded-[10px] border text-[13px] font-medium',
    'hover:border-[#94A3B8] transition-all duration-[180ms]',
    dark
      ? 'bg-[#1E293B] border-[#334155] text-[#94A3B8]'
      : 'bg-white border-[#E2E8F0] text-[#4A5568]'
  )
  const footerDivider = cn('border-t mt-6 pt-5', dark ? 'border-[#334155]' : 'border-[#E2E8F0]')

  return (
    <div className="p-7">
      <div className="grid grid-cols-[220px_1fr] gap-5">

        {/* ── Left nav ─────────────────────────────────── */}
        <div className={cn(panelClass, 'p-2 h-fit')}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-[9px] rounded-[8px]',
                'text-[13.5px] font-medium text-left transition-all duration-[180ms] mb-[2px] last:mb-0',
                activeTab === tab.id
                  ? tab.danger
                    ? dark
                      ? 'bg-[#3A1A1A] text-[#FECACA]'
                      : 'bg-[#FEF2F2] text-[#B91C1C]'
                    : dark
                      ? 'bg-[#1E3A5F] text-[#93C5FD]'
                      : 'bg-[#EBF3FF] text-[#1A56DB]'
                  : tab.danger
                    ? 'text-[#B91C1C] hover:bg-[#FEF2F2]'
                    : dark
                      ? 'text-[#94A3B8] hover:bg-[#243150]'
                      : 'text-[#4A5568] hover:bg-[#F7FAFC]'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Right panel ──────────────────────────────── */}
        <div className={cn(panelClass, 'p-8')}>

          {/* ── PROFILE ─────────────────────────────────── */}
          {activeTab === 'profile' && (
            <div>
              <h2 className={cn('font-head text-[17px] font-bold mb-1', dark ? 'text-[#F1F5F9]' : 'text-[#0D1B2A]')}>
                Profile Settings
              </h2>
              <p className="text-[13px] text-[#94A3B8] mb-7">
                Manage your personal information and credentials
              </p>

              {/* Avatar upload */}
              <div className="flex items-center gap-5 mb-7">
                <div className="relative">
                  <div className="w-[72px] h-[72px] rounded-full overflow-hidden border-2 border-white shadow-md bg-gradient-to-br from-[#1A56DB] to-[#7C3AED] flex items-center justify-center">
                    {avatarPreview
                      ? <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                      : <span className="font-head text-[24px] font-bold text-white w-full h-full flex items-center justify-center">{initials}</span>
                    }
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'absolute bottom-0 right-0 w-[26px] h-[26px] rounded-full border',
                      'flex items-center justify-center shadow-sm transition-colors',
                      'hover:border-[#1A56DB] hover:bg-[#EBF3FF]',
                      dark ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
                    )}
                    title="Upload photo"
                  >
                    <Camera size={12} className="text-[#4A5568]" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <div>
                  <div className={cn('text-[14px] font-semibold', dark ? 'text-[#F1F5F9]' : 'text-[#0D1B2A]')}>
                    {draft.firstName} {draft.lastName}
                  </div>
                  <div className="text-[13px] text-[#94A3B8]">{draft.email}</div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-[12px] text-[#1A56DB] font-medium hover:underline"
                  >
                    Change photo
                  </button>
                  {avatarPreview && (
                    <button
                      onClick={() => { setAvatarPreview(null); setDraft(p => ({ ...p, avatarUrl: null })) }}
                      className="mt-2 ml-3 text-[12px] text-[#94A3B8] hover:text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                  <p className="text-[11px] text-[#94A3B8] mt-1">JPG, PNG, WebP · Max 2MB</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <FormField dark={dark} label="First Name"          value={draft.firstName}  onChange={v => updateDraft('firstName', v)}  placeholder="First name" />
                <FormField dark={dark} label="Last Name"           value={draft.lastName}   onChange={v => updateDraft('lastName', v)}   placeholder="Last name" />
                <FormField dark={dark} label="Email Address" type="email" value={draft.email} onChange={v => updateDraft('email', v)}   placeholder="your@email.com" />
                <FormField dark={dark} label="Specialty"           value={draft.specialty}  onChange={v => updateDraft('specialty', v)}  placeholder="e.g. General Practice" />
                <FormField dark={dark} label="Hospital / Clinic"   value={draft.hospital}   onChange={v => updateDraft('hospital', v)}   placeholder="Institution name" />
                <FormField dark={dark} label="Medical License No." value={draft.licenseNo}  onChange={v => updateDraft('licenseNo', v)}  placeholder="License number" />
              </div>

              <div className={cn('flex justify-end gap-3', footerDivider)}>
                <button
                  onClick={() => { setDraft({ ...profile }); setAvatarPreview(profile.avatarUrl) }}
                  className={cancelBtnClass}
                >
                  Discard
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="flex items-center gap-2 px-[16px] py-[8px] rounded-[10px] bg-[#1A56DB] text-white text-[13px] font-semibold hover:bg-[#1648C0] hover:shadow-[0_4px_14px_rgba(26,86,219,0.35)] transition-all duration-[180ms]"
                >
                  <Save size={13} />
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* ── PREFERENCES ─────────────────────────────── */}
          {activeTab === 'preferences' && (
            <div>
              <h2 className={cn('font-head text-[17px] font-bold mb-1', dark ? 'text-[#F1F5F9]' : 'text-[#0D1B2A]')}>
                Preferences
              </h2>
              <p className="text-[13px] text-[#94A3B8] mb-6">
                Customise how MediScribe AI behaves for you
              </p>

              <SettingRow dark={dark} label="Dark Mode" sub="Switch the entire interface to a dark theme">
                <Toggle value={preferences.darkMode} onChange={v => updatePreferences({ darkMode: v })} />
              </SettingRow>
              <SettingRow dark={dark} label="Auto-scroll to Results" sub="Automatically scroll down when transcription completes">
                <Toggle value={preferences.autoScroll} onChange={v => updatePreferences({ autoScroll: v })} />
              </SettingRow>
              <SettingRow dark={dark} label="Compact View" sub="Show results in a condensed layout to reduce scrolling">
                <Toggle value={preferences.compactView} onChange={v => updatePreferences({ compactView: v })} />
              </SettingRow>
              <SettingRow dark={dark} label="Show Confidence Score" sub="Display the AI confidence percentage on the transcription card">
                <Toggle value={preferences.showConfidence} onChange={v => updatePreferences({ showConfidence: v })} />
              </SettingRow>
              <SettingRow dark={dark} label="Auto-copy Transcription" sub="Automatically copy transcription text to clipboard when done">
                <Toggle value={preferences.autoCopy} onChange={v => updatePreferences({ autoCopy: v })} />
              </SettingRow>

              <div className={cn('flex justify-end', footerDivider)}>
                <button
                  onClick={() => toast.success('Preferences saved')}
                  className="flex items-center gap-2 px-[16px] py-[8px] rounded-[10px] bg-[#1A56DB] text-white text-[13px] font-semibold hover:bg-[#1648C0] transition-all duration-[180ms]"
                >
                  <Save size={13} />
                  Save Preferences
                </button>
              </div>
            </div>
          )}

          {/* ── NOTIFICATIONS ───────────────────────────── */}
          {activeTab === 'notifications' && (
            <div>
              <h2 className={cn('font-head text-[17px] font-bold mb-1', dark ? 'text-[#F1F5F9]' : 'text-[#0D1B2A]')}>
                Notifications
              </h2>
              <p className="text-[13px] text-[#94A3B8] mb-6">
                Choose what you want to be notified about
              </p>

              <SettingRow dark={dark} label="Email Notifications" sub="Receive emails for important account activity">
                <Toggle value={notifications.emailNotifs} onChange={v => updateNotifications({ emailNotifs: v })} />
              </SettingRow>
              <SettingRow dark={dark} label="Transcription Complete" sub="Get notified when a transcription finishes processing">
                <Toggle value={notifications.transcriptDone} onChange={v => updateNotifications({ transcriptDone: v })} />
              </SettingRow>
              <SettingRow dark={dark} label="Weekly Usage Report" sub="Receive a weekly summary of your transcription activity">
                <Toggle value={notifications.weeklyReport} onChange={v => updateNotifications({ weeklyReport: v })} />
              </SettingRow>

              <div className={cn('flex justify-end', footerDivider)}>
                <button
                  onClick={() => toast.success('Notification preferences saved')}
                  className="flex items-center gap-2 px-[16px] py-[8px] rounded-[10px] bg-[#1A56DB] text-white text-[13px] font-semibold hover:bg-[#1648C0] transition-all duration-[180ms]"
                >
                  <Save size={13} />
                  Save
                </button>
              </div>
            </div>
          )}

          {/* ── API ─────────────────────────────────────── */}
          {activeTab === 'api' && (
            <div>
              <h2 className={cn('font-head text-[17px] font-bold mb-1', dark ? 'text-[#F1F5F9]' : 'text-[#0D1B2A]')}>
                API & Integrations
              </h2>
              <p className="text-[13px] text-[#94A3B8] mb-6">
                Manage your API configuration and backend connection
              </p>

              <div className="mb-6">
                <FormField dark={dark} label="Backend API URL" value="http://localhost:8000" onChange={() => {}} placeholder="http://localhost:8000" />
                <p className="text-[12px] text-[#94A3B8] mt-2">The URL where your FastAPI backend is running</p>
              </div>

              <div className={cn(
                'flex items-center gap-3 p-4 rounded-[10px] border mb-6',
                dark ? 'bg-[#0D3327] border-[#0BA871]/30' : 'bg-[#E6F7F2] border-[#0BA871]/30'
              )}>
                <div className="w-[8px] h-[8px] rounded-full bg-[#0BA871] animate-pulse flex-shrink-0" />
                <div>
                  <div className={cn('text-[13px] font-semibold', dark ? 'text-[#6EE7B7]' : 'text-[#065F46]')}>
                    Backend connected
                  </div>
                  <div className="text-[12px] text-[#0BA871]">FastAPI running on port 8000</div>
                </div>
              </div>

              <div className={cn(
                'border rounded-[10px] p-4',
                dark ? 'bg-[#0F172A] border-[#334155]' : 'bg-[#F7FAFC] border-[#E2E8F0]'
              )}>
                <div className={cn(
                  'text-[12px] font-semibold mb-2 uppercase tracking-wide',
                  dark ? 'text-[#94A3B8]' : 'text-[#4A5568]'
                )}>
                  API Endpoints
                </div>
                {[
                  { method: 'POST', path: '/api/transcribe', desc: 'Transcribe audio file'   },
                  { method: 'GET',  path: '/api/health',     desc: 'Health check'             },
                  { method: 'POST', path: '/api/validate',   desc: 'Validate medical content' },
                ].map(ep => (
                  <div
                    key={ep.path}
                    className={cn(
                      'flex items-center gap-3 py-2 border-b last:border-b-0',
                      dark ? 'border-[#334155]' : 'border-[#E2E8F0]'
                    )}
                  >
                    <span className={cn(
                      'font-mono text-[10px] font-bold px-[6px] py-[2px] rounded-[4px]',
                      ep.method === 'POST'
                        ? dark ? 'bg-[#1E3A5F] text-[#93C5FD]' : 'bg-[#EBF3FF] text-[#1A56DB]'
                        : dark ? 'bg-[#0D3327] text-[#6EE7B7]' : 'bg-[#E6F7F2] text-[#065F46]'
                    )}>
                      {ep.method}
                    </span>
                    <span className={cn('font-mono text-[12px]', dark ? 'text-[#94A3B8]' : 'text-[#4A5568]')}>
                      {ep.path}
                    </span>
                    <span className="text-[12px] text-[#94A3B8] ml-auto">{ep.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── DANGER ZONE ─────────────────────────────── */}
          {activeTab === 'danger' && (
            <div>
              <h2 className="font-head text-[17px] font-bold text-[#B91C1C] mb-1">
                Danger Zone
              </h2>
              <p className="text-[13px] text-[#94A3B8] mb-6">
                Irreversible actions — proceed with caution
              </p>

              <div className={cn(
                'border rounded-[12px] overflow-hidden',
                dark ? 'border-[#F87171]/30' : 'border-[#FECACA]'
              )}>
                <div className={cn(
                  'p-5 flex items-start justify-between gap-4 border-b',
                  dark ? 'border-[#F87171]/30' : 'border-[#FECACA]'
                )}>
                  <div>
                    <div className={cn('text-[14px] font-semibold mb-1', dark ? 'text-[#F1F5F9]' : 'text-[#0D1B2A]')}>
                      Clear Transcription History
                    </div>
                    <div className="text-[13px] text-[#94A3B8]">
                      Permanently delete all {history.length} transcription record{history.length !== 1 ? 's' : ''}. This cannot be undone.
                    </div>
                  </div>
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    disabled={history.length === 0}
                    className={cn(
                      'flex-shrink-0 px-[14px] py-[7px] rounded-[8px] border text-[13px] font-medium',
                      'disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-[180ms]',
                      dark
                        ? 'bg-[#3A1A1A] text-[#FECACA] border-[#F87171]/30 hover:bg-[#4A2020]'
                        : 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA] hover:bg-[#FEE2E2]'
                    )}
                  >
                    Clear History
                  </button>
                </div>
                <div className="p-5 flex items-start justify-between gap-4">
                  <div>
                    <div className={cn('text-[14px] font-semibold mb-1', dark ? 'text-[#F1F5F9]' : 'text-[#0D1B2A]')}>
                      Reset All Settings
                    </div>
                    <div className="text-[13px] text-[#94A3B8]">
                      Reset all preferences and settings to their default values.
                    </div>
                  </div>
                  <button
                    onClick={() => { resetSettings(); toast.info('Settings reset to defaults') }}
                    className={cn(
                      'flex-shrink-0 px-[14px] py-[7px] rounded-[8px] border text-[13px] font-medium',
                      'transition-all duration-[180ms]',
                      dark
                        ? 'bg-[#3A1A1A] text-[#FECACA] border-[#F87171]/30 hover:bg-[#4A2020]'
                        : 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA] hover:bg-[#FEE2E2]'
                    )}
                  >
                    Reset Settings
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ── Clear confirm modal ───────────────────────────── */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center"
          onClick={e => { if (e.target === e.currentTarget) setShowClearConfirm(false) }}
        >
          <div className={cn(
            'border rounded-[14px] p-8 max-w-[400px] w-full mx-4 shadow-xl',
            dark ? 'bg-[#1E293B] border-[#334155]' : 'bg-white border-[#E2E8F0]'
          )}>
            <div className="flex items-start gap-4 mb-5">
              <div className={cn(
                'w-[40px] h-[40px] rounded-full flex items-center justify-center flex-shrink-0',
                dark ? 'bg-[#3A1A1A]' : 'bg-[#FEF2F2]'
              )}>
                <AlertTriangle size={18} className="text-[#B91C1C]" />
              </div>
              <div>
                <h3 className={cn('font-head text-[17px] font-bold mb-1', dark ? 'text-[#F1F5F9]' : 'text-[#0D1B2A]')}>
                  Clear All History?
                </h3>
                <p className={cn('text-[13.5px] leading-[1.6]', dark ? 'text-[#94A3B8]' : 'text-[#4A5568]')}>
                  This will permanently delete all{' '}
                  <strong>{history.length} transcription{history.length !== 1 ? 's' : ''}</strong>. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowClearConfirm(false)}
                className={cancelBtnClass}
              >
                Cancel
              </button>
              <button
                onClick={() => { clearHistory(); setShowClearConfirm(false); toast.success('History cleared') }}
                className="px-[16px] py-[8px] rounded-[10px] bg-[#B91C1C] text-white text-[13px] font-semibold hover:bg-[#991B1B] transition-all duration-[180ms]"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
