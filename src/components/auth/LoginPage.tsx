
import { useState } from 'react'
import { signIn, signUp } from '../../lib/auth'
import { isOffline } from '../../lib/supabase'

interface Props { onLogin: () => void }

export default function LoginPage({ onLogin }: Props) {
  const [mode, setMode]       = useState<'login'|'signup'>('login')
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [nom, setNom]         = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        await signUp(email, password, nom)
      }
      onLogin()
    } catch (err: any) {
      setError(err.message ?? 'Erreur de connexion')
    } finally { setLoading(false) }
  }

  if (isOffline) {
    return (
      <div style={container}>
        <div style={card}>
          <div style={logo}>✦ Éclat & Vous</div>
          <div style={{ background:'var(--amber-light)', borderRadius:8, padding:'12px 14px', marginBottom:16, fontSize:13, color:'#412402', border:'1px solid #e8c064' }}>
            <strong>Mode démo</strong> — Supabase non configuré.<br/>
            L'authentification est désactivée. Toutes les fonctionnalités sont accessibles avec des données fictives.
          </div>
          <button className="btn btn-primary" style={{ width:'100%', height:44 }} onClick={onLogin}>
            Accéder en mode démo →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={container}>
      <div style={card}>
        <div style={logo}>✦ Éclat & Vous</div>
        <div style={{ fontSize:13, color:'var(--gray-600)', textAlign:'center', marginBottom:24 }}>
          {mode === 'login' ? 'Connexion à votre espace praticien' : 'Créer un compte praticien'}
        </div>

        <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {mode === 'signup' && (
            <div>
              <label style={label}>Nom complet</label>
              <input type="text" value={nom} onChange={e => setNom(e.target.value)} placeholder="Dr. Marie Martin" required style={input} />
            </div>
          )}
          <div>
            <label style={label}>Email professionnel</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@cabinet.fr" required style={input} />
          </div>
          <div>
            <label style={label}>Mot de passe</label>
            <input type="password" value={password} onChange={e => setPass(e.target.value)} placeholder="••••••••" required minLength={8} style={input} />
          </div>

          {error && (
            <div style={{ background:'var(--coral-light)', borderRadius:8, padding:'10px 12px', fontSize:13, color:'var(--coral)', border:'1px solid rgba(216,90,48,.2)' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ height:44, fontSize:14, marginTop:4 }}>
            {loading ? 'Connexion…' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>

        <div style={{ textAlign:'center', marginTop:16, fontSize:13, color:'var(--gray-400)' }}>
          {mode === 'login' ? (
            <>Pas encore de compte ? <button onClick={() => setMode('signup')} style={{ background:'none', border:'none', color:'var(--teal)', cursor:'pointer', fontWeight:500 }}>Créer un compte</button></>
          ) : (
            <>Déjà un compte ? <button onClick={() => setMode('login')} style={{ background:'none', border:'none', color:'var(--teal)', cursor:'pointer', fontWeight:500 }}>Se connecter</button></>
          )}
        </div>
      </div>
    </div>
  )
}

const container: React.CSSProperties = { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--gray-50)', padding:20 }
const card: React.CSSProperties      = { background:'#fff', borderRadius:16, border:'1px solid #eeeae0', padding:'32px 28px', width:'100%', maxWidth:420, boxShadow:'0 4px 24px rgba(0,0,0,.06)' }
const logo: React.CSSProperties      = { fontSize:24, fontWeight:700, color:'var(--teal-dark)', textAlign:'center', marginBottom:8 }
const label: React.CSSProperties     = { fontSize:12, fontWeight:500, color:'var(--gray-600)', display:'block', marginBottom:4 }
const input: React.CSSProperties     = { width:'100%' }
