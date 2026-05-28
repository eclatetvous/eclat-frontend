import { useState } from 'react'
import type { PraticienUser } from '../../lib/auth'
import { signOut } from '../../lib/auth'
import { notify } from '../../lib/toast'
import RgpdPage from '../auth/RgpdPage'

type AppMode = 'praticien' | 'apprenant'

interface Props {
  mode: AppMode; onModeChange: (m: AppMode) => void
  user: PraticienUser | null; children: React.ReactNode
}

export default function Layout({ mode, onModeChange, user, children }: Props) {
  const [showRgpd, setShowRgpd] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  async function handleSignOut() {
    await signOut(); notify.info('Déconnecté')
    window.location.reload()
  }

  if (showRgpd && user) {
    return <RgpdPage praticienId={user.id} onBack={() => setShowRgpd(false)} />
  }

  return (
    <>
    <a href="#main-content" style={{ position:'absolute',top:-40,left:0,background:'var(--teal)',color:'#fff',padding:'8px 16px',zIndex:9999,borderRadius:'0 0 8px 0',fontWeight:600,transition:'top .1s' }} onFocus={e=>(e.currentTarget.style.top='0')} onBlur={e=>(e.currentTarget.style.top='-40px')}>
      Aller au contenu principal
    </a>

    <div style={{ minHeight:'100vh', background:'var(--gray-50)', display:'flex', flexDirection:'column' }}>

      {/* Header */}
      <header role="banner" style={{ background:'#fff', borderBottom:'1px solid #eeeae0', padding:'0 20px', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:56 }}>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <div style={{ fontWeight:700, fontSize:17, color:'var(--teal-dark)' }}>✦ Éclat & Vous</div>
            <nav role="navigation" aria-label="Mode d'interface" className="tabs-row" style={{ display:'flex', gap:4 }}>
              {([
                ['praticien', '🩺 Praticien'],
                ['apprenant', '📚 Apprenant'],
              ] as const).map(([m, label]) => (
                <button key={m} onClick={() => onModeChange(m)} aria-current={mode === m ? 'page' : undefined}
                  style={{ padding:'6px 14px', borderRadius:8, border:'1px solid', fontWeight: mode===m?600:400, fontSize:13, cursor:'pointer',
                    background: mode===m?'var(--teal-light)':'transparent',
                    borderColor: mode===m?'var(--teal)':'transparent',
                    color: mode===m?'var(--teal-dark)':'var(--gray-600)',
                  }}>
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {user && (
            <div style={{ position:'relative' }}>
              <button onClick={() => setShowMenu(s=>!s)} aria-label="Menu utilisateur" aria-expanded={showMenu}
                style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', borderRadius:8, border:'1px solid #eeeae0', background:'var(--gray-50)', cursor:'pointer', fontSize:13 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--teal)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13 }}>
                  {(user.nom ?? user.email)[0].toUpperCase()}
                </div>
                <span style={{ color:'var(--gray-900)', maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {user.nom ?? user.email}
                </span>
              </button>
              {showMenu && (
                <div role="menu" style={{ position:'absolute', right:0, top:'calc(100% + 6px)', background:'#fff', border:'1px solid #eeeae0', borderRadius:10, boxShadow:'0 4px 20px rgba(0,0,0,.08)', minWidth:200, overflow:'hidden', zIndex:200 }}>
                  <div style={{ padding:'12px 14px', borderBottom:'1px solid #eeeae0', fontSize:12, color:'var(--gray-400)' }}>{user.email}</div>
                  <button role="menuitem" onClick={() => { setShowRgpd(true); setShowMenu(false) }} style={{ width:'100%', padding:'10px 14px', textAlign:'left', border:'none', background:'none', cursor:'pointer', fontSize:13, color:'var(--gray-900)' }}>
                    🛡️ Confidentialité & RGPD
                  </button>
                  <button role="menuitem" onClick={handleSignOut} style={{ width:'100%', padding:'10px 14px', textAlign:'left', border:'none', background:'none', cursor:'pointer', fontSize:13, color:'var(--coral)' }}>
                    ↩ Se déconnecter
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Contenu */}
      <div style={{ flex:1, maxWidth:1200, margin:'0 auto', width:'100%', padding:'24px 20px' }}>
        {children}
      </div>
    </div>
    </>
  )
}
