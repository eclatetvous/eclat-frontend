
import { useState } from 'react'
import ListeApprenants from './ListeApprenants'
import FicheApprenant from './FicheApprenant'
import type { ApprenantProfile } from '../../../types'

export default function ConsolePanel() {
  const [selected, setSelected] = useState<ApprenantProfile | null>(null)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '280px 1fr',
      gap: 20,
      alignItems: 'flex-start',
      minHeight: 600,
    }}>
      {/* Colonne gauche — liste apprenants */}
      <div style={{
        background: '#fff',
        borderRadius: 14,
        border: '1px solid #eeeae0',
        padding: 16,
        position: 'sticky',
        top: 20,
      }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14, color: 'var(--gray-900)' }}>
          👤 Apprenants
        </div>
        <ListeApprenants
          onSelect={setSelected}
          selected={selected?.id ?? null}
        />
      </div>

      {/* Colonne droite — fiche apprenant */}
      {selected ? (
        <FicheApprenant key={selected.id} apprenant={selected} />
      ) : (
        <div style={{
          background: '#fff',
          borderRadius: 14,
          border: '1px solid #eeeae0',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          color: 'var(--gray-400)',
          textAlign: 'center',
          padding: 40,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👈</div>
          <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
            Sélectionnez un apprenant
          </div>
          <div style={{ fontSize: 13 }}>
            Cliquez sur un nom dans la liste pour ouvrir son dossier complet.
          </div>
        </div>
      )}
    </div>
  )
}
