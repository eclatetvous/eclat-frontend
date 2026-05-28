
// Export PDF du dossier apprenant complet
// Utilise l'API Anthropic pour générer le bilan puis html2pdf via window.print

export async function exportDossierPdf(apprenant: any, niveaux: any, evals: any[], affectations: any[], bilan: string) {
  const NIV = ['','Initiation','Développement','Consolidation','Maîtrise']
  const NIV_PCT: Record<number,number> = {1:15,2:40,3:70,4:100}

  const domainesHtml = Object.entries(niveaux).map(([d,n]: any) => `
    <tr>
      <td style="padding:6px 10px;font-weight:500">${d}</td>
      <td style="padding:6px 10px">${NIV[n]}</td>
      <td style="padding:6px 10px">
        <div style="width:120px;height:8px;background:#e5e5e0;border-radius:4px;overflow:hidden">
          <div style="width:${NIV_PCT[n]}%;height:100%;background:#1D9E75;border-radius:4px"></div>
        </div>
      </td>
    </tr>
  `).join('')

  const evHtml = evals.slice(0,10).map(ev => `
    <tr>
      <td style="padding:6px 10px">${ev.domaine_id}</td>
      <td style="padding:6px 10px">${ev.titre_evaluation ?? ev.evaluation_id}</td>
      <td style="padding:6px 10px">${new Date(ev.date_passation).toLocaleDateString('fr-FR')}</td>
      <td style="padding:6px 10px;font-weight:500;color:${ev.statut==='clinique'?'#D85A30':ev.statut==='limite'?'#BA7517':'#1D9E75'}">${ev.statut}</td>
    </tr>
  `).join('')

  const age = Math.floor(apprenant.age_mois / 12)
  const today = new Date().toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' })

  const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Dossier ${apprenant.prenom}</title>
<style>
  @page { margin: 2cm; }
  * { font-family: Arial, sans-serif; color: #2C2C2A; }
  body { font-size: 12pt; line-height: 1.6; }
  h1 { font-size: 20pt; color: #085041; border-bottom: 2px solid #1D9E75; padding-bottom: 8px; }
  h2 { font-size: 14pt; color: #085041; margin-top: 24px; margin-bottom: 8px; }
  .header { display: flex; justify-content: space-between; margin-bottom: 24px; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; background: #E1F5EE; color: #085041; font-size: 10pt; font-weight: bold; margin-right: 6px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th { background: #1D9E75; color: #fff; padding: 8px 10px; text-align: left; font-size: 10pt; }
  tr:nth-child(even) { background: #F1EFE8; }
  .bilan { background: #F1EFE8; padding: 16px; border-radius: 8px; margin-top: 8px; white-space: pre-wrap; font-size: 11pt; line-height: 1.8; }
  .footer { margin-top: 40px; font-size: 9pt; color: #5F5E5A; border-top: 1px solid #D3D1C7; padding-top: 8px; }
  .no-print { display: none !important; }
</style>
</head><body>
<h1>Dossier de suivi — Éclat & Vous</h1>
<div class="header">
  <div>
    <strong style="font-size:16pt">${apprenant.prenom}${apprenant.nom?' '+apprenant.nom:''}</strong><br>
    ${age} ans · ${apprenant.niveau_classe ?? '—'}<br>
    ${apprenant.profils_tnd.map((t:string) => `<span class="badge">${t}</span>`).join('')}
  </div>
  <div style="text-align:right;color:#5F5E5A;font-size:10pt">
    Date du bilan : ${today}<br>
    Outil : Éclat & Vous v1.0
  </div>
</div>

<h2>Profil cognitif</h2>
<table><thead><tr><th>Domaine</th><th>Niveau</th><th>Progression</th></tr></thead>
<tbody>${domainesHtml}</tbody></table>

${evals.length > 0 ? `<h2>Évaluations réalisées</h2>
<table><thead><tr><th>Domaine</th><th>Évaluation</th><th>Date</th><th>Statut</th></tr></thead>
<tbody>${evHtml}</tbody></table>` : ''}

${bilan ? `<h2>Bilan clinique</h2><div class="bilan">${bilan}</div>` : ''}

<div class="footer">
  Document généré par Éclat & Vous — Usage professionnel uniquement — Confidentiel<br>
  Ce bilan doit être validé par le praticien avant toute transmission.
</div>
</body></html>`

  // Ouvrir dans une nouvelle fenêtre et imprimer
  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  setTimeout(() => { win.print() }, 500)
}
