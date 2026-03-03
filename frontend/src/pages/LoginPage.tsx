import { useState } from 'react'
import { useAppStore } from '../store/appStore'
import { Zap, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '../lib/utils'

const STATS = [
  { value: '8→3 min', label: 'Documentation time'  },
  { value: '700+',    label: 'Medical terms'        },
  { value: '87%',     label: 'Avg. confidence'      },
]

const TESTIMONIAL = {
  quote: '"MediScribe reduced my post-clinic documentation from 45 minutes to under 10. The SOAP notes are accurate and ready to review immediately after the appointment."',
  name:  'Dr. Rachel Kim',
  role:  'Primary Care Physician, Vancouver',
}

export default function LoginPage() {
  const { setPage, preferences } = useAppStore()
  const dark = preferences.darkMode

  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [remember,  setRemember]  = useState(false)
  const [showPass,  setShowPass]  = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mode,      setMode]      = useState<'login' | 'register'>('login')

  // Register fields
  const [firstName, setFirstName] = useState('')
  const [lastName,  setLastName]  = useState('')
  const [specialty, setSpecialty] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast.error('Please enter your email address')
      return
    }
    if (!password.trim() || password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (mode === 'register' && (!firstName.trim() || !lastName.trim())) {
      toast.error('Please enter your full name')
      return
    }

    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1200))
    setIsLoading(false)

    toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!', {
      description: mode === 'login'
        ? 'Redirecting to your dashboard...'
        : 'Your account is ready. Redirecting...',
    })

    setTimeout(() => setPage('dashboard'), 600)
  }

  return (
    <div className="flex w-full min-h-screen">

      {/* ── Left panel — intentionally always dark ────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[48%] min-h-screen p-[52px] relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #0D1B2A 0%, #0F2D4A 50%, #0A1E32 100%)' }}
      >
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 60px),
                              repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 60px)`,
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-[42px] h-[42px] rounded-[10px] bg-gradient-to-br from-[#1A56DB] to-[#0BA871] flex items-center justify-center">
              <Zap size={22} className="text-white" fill="white" />
            </div>
            <div>
              <div className="font-head text-[18px] font-bold text-white leading-tight">
                MediScribe AI
              </div>
              <div className="text-[10px] text-[#4A6080] uppercase tracking-[0.05em]">
                Clinical Documentation
              </div>
            </div>
          </div>

          <h1 className="font-head text-[36px] font-extrabold text-white leading-[1.12] mb-5">
            Clinical notes.<br />
            <span className="text-[#6BA3FF]">Written by AI.</span><br />
            Reviewed by you.
          </h1>
          <p className="text-[14.5px] text-[#6B8CAE] leading-[1.75] max-w-[360px]">
            Transform doctor–patient conversations into structured SOAP notes instantly.
            Powered by Whisper AI and medical-grade NLP.
          </p>
        </div>

        {/* Testimonial */}
        <div className="relative z-10">
          <div
            className="rounded-[14px] p-6 mb-8"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-[13.5px] text-[#94A3B8] leading-[1.75] mb-4 italic">
              {TESTIMONIAL.quote}
            </p>
            <div className="flex items-center gap-3">
              <div className="w-[34px] h-[34px] rounded-full bg-gradient-to-br from-[#1A56DB] to-[#0BA871] flex items-center justify-center flex-shrink-0">
                <span className="font-head text-[11px] font-bold text-white">RK</span>
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#C5D8EE]">{TESTIMONIAL.name}</div>
                <div className="text-[11px] text-[#4A6080]">{TESTIMONIAL.role}</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-8">
            {STATS.map(s => (
              <div key={s.label}>
                <div className="font-head text-[26px] font-extrabold text-white leading-none mb-1">
                  {s.value}
                </div>
                <div className="text-[11.5px] text-[#4A6080]">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel ──────────────────────────────────── */}
      <div className={cn(
        'flex-1 flex items-center justify-center px-6 py-12',
        dark ? 'bg-[#0F172A]' : 'bg-[#F7FAFC]'
      )}>
        <div className="w-full max-w-[400px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-[36px] h-[36px] rounded-[8px] bg-gradient-to-br from-[#1A56DB] to-[#0BA871] flex items-center justify-center">
              <Zap size={18} className="text-white" fill="white" />
            </div>
            <div className={cn('font-head text-[16px] font-bold', dark ? 'text-[#F1F5F9]' : 'text-[#0D1B2A]')}>
              MediScribe AI
            </div>
          </div>

          {/* Heading */}
          <h2 className={cn('font-head text-[26px] font-bold mb-1', dark ? 'text-[#F1F5F9]' : 'text-[#0D1B2A]')}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className={cn('text-[14px] mb-7', dark ? 'text-[#94A3B8]' : 'text-[#4A5568]')}>
            {mode === 'login'
              ? 'Sign in to your MediScribe account'
              : 'Get started with MediScribe AI for free'
            }
          </p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Register-only fields */}
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-3">
                <AuthField dark={dark} label="First Name" type="text"  value={firstName} onChange={setFirstName} placeholder="First name" />
                <AuthField dark={dark} label="Last Name"  type="text"  value={lastName}  onChange={setLastName}  placeholder="Last name" />
                <div className="col-span-2">
                  <AuthField dark={dark} label="Specialty" type="text" value={specialty} onChange={setSpecialty} placeholder="e.g. General Practice" />
                </div>
              </div>
            )}

            <AuthField dark={dark} label="Email address" type="email" value={email} onChange={setEmail} placeholder="dr.smith@hospital.com" />

            {/* Password — inline because of show/hide toggle */}
            <div>
              <label className={cn('block text-[13px] font-semibold mb-[5px]', dark ? 'text-[#E2E8F0]' : 'text-[#0D1B2A]')}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'register' ? 'Minimum 6 characters' : '••••••••'}
                  className={cn(
                    'w-full px-[13px] py-[10px] pr-[40px] border rounded-[10px] text-[14px] font-sans',
                    'placeholder:text-[#94A3B8] outline-none focus:border-[#1A56DB] transition-all duration-[180ms]',
                    dark
                      ? 'bg-[#0F172A] border-[#334155] text-[#E2E8F0]'
                      : 'bg-[#F7FAFC] border-[#E2E8F0] text-[#0D1B2A] focus:bg-white'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#4A5568] transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember me / Forgot password */}
            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="w-[14px] h-[14px] accent-[#1A56DB] cursor-pointer"
                  />
                  <span className={cn('text-[13px]', dark ? 'text-[#94A3B8]' : 'text-[#4A5568]')}>
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => toast.info('Password reset coming in a future update')}
                  className={cn(
                    'text-[13px] font-medium underline transition-colors hover:text-[#1A56DB]',
                    dark ? 'text-[#94A3B8]' : 'text-[#4A5568]'
                  )}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full flex items-center justify-center gap-2',
                'py-[11px] rounded-[10px] font-semibold text-[14px] text-white',
                'bg-[#1A56DB] hover:bg-[#1648C0]',
                'hover:shadow-[0_4px_14px_rgba(26,86,219,0.4)] hover:-translate-y-px',
                'disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0',
                'transition-all duration-[180ms]'
              )}
            >
              {isLoading
                ? <span className="flex items-center gap-2">
                    <span className="w-[14px] h-[14px] rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </span>
                : <span className="flex items-center gap-2">
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={15} />
                  </span>
              }
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className={cn('flex-1 h-px', dark ? 'bg-[#334155]' : 'bg-[#E2E8F0]')} />
            <span className="text-[12px] text-[#94A3B8]">or</span>
            <div className={cn('flex-1 h-px', dark ? 'bg-[#334155]' : 'bg-[#E2E8F0]')} />
          </div>

          {/* Google SSO — placeholder */}
          <button
            type="button"
            onClick={() => toast.info('Google SSO coming in a future update')}
            className={cn(
              'w-full flex items-center justify-center gap-3 py-[10px] rounded-[10px] border',
              'text-[13.5px] font-medium transition-all duration-[180ms]',
              dark
                ? 'bg-[#1E293B] border-[#334155] text-[#94A3B8] hover:border-[#4A5568] hover:bg-[#243150]'
                : 'bg-white border-[#E2E8F0] text-[#4A5568] hover:border-[#94A3B8] hover:bg-[#F7FAFC]'
            )}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          {/* Mode switch */}
          <p className={cn('text-center text-[13.5px] mt-5', dark ? 'text-[#94A3B8]' : 'text-[#4A5568]')}>
            {mode === 'login'
              ? <>Don't have an account?{' '}
                  <button type="button" onClick={() => setMode('register')} className="text-[#1A56DB] font-semibold hover:underline">
                    Sign up free
                  </button>
                </>
              : <>Already have an account?{' '}
                  <button type="button" onClick={() => setMode('login')} className="text-[#1A56DB] font-semibold hover:underline">
                    Sign in
                  </button>
                </>
            }
          </p>

          <p className={cn('text-center text-[11px] mt-4 leading-relaxed', dark ? 'text-[#4A6080]' : 'text-[#94A3B8]')}>
            By continuing you agree to our{' '}
            <span className="underline cursor-pointer hover:text-[#4A5568]">Terms of Service</span>
            {' '}and{' '}
            <span className="underline cursor-pointer hover:text-[#4A5568]">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Reusable auth field ───────────────────────────────────
function AuthField({ label, type, value, onChange, placeholder, dark }: {
  label: string; type: string; value: string
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
          'w-full px-[13px] py-[10px] border rounded-[10px] text-[14px] font-sans',
          'placeholder:text-[#94A3B8] outline-none focus:border-[#1A56DB] transition-all duration-[180ms]',
          dark
            ? 'bg-[#0F172A] border-[#334155] text-[#E2E8F0]'
            : 'bg-[#F7FAFC] border-[#E2E8F0] text-[#0D1B2A] focus:bg-white'
        )}
      />
    </div>
  )
}

// ── Google icon SVG ───────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}