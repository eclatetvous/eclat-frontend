# Éclat & Vous — Frontend
## React + TypeScript + Vite · Guide de démarrage

---

## Architecture

```
src/
├── App.tsx                         ← Racine, switche entre les deux modes
├── main.tsx                        ← Point d'entrée React
├── index.css                       ← Styles globaux + variables CSS
├── types/index.ts                  ← Tous les types TypeScript
├── lib/
│   ├── api.ts                      ← Fonctions d'appel à l'API REST
│   └── supabase.ts                 ← Persistance apprenant (Supabase)
├── hooks/
│   ├── useApi.ts                   ← Hook générique async + états
│   └── useSearch.ts                ← Hook de recherche avec debounce
└── components/
    ├── shared/
    │   ├── Layout.tsx              ← En-tête + switcher de mode
    │   └── ContentCard.tsx         ← Carte de contenu réutilisable
    ├── praticien/
    │   ├── DashboardPraticien.tsx  ← Dashboard + métriques + onglets
    │   ├── SearchPanel.tsx         ← Recherche multicritères + filtres
    │   ├── DetailPanel.tsx         ← Panneau latéral de détail
    │   ├── RecoPanel.tsx           ← Formulaire de recommandation
    │   └── ParcoursPanel.tsx       ← Navigation par parcours et phases
    └── apprenant/
        ├── DashboardApprenant.tsx  ← Vue principale apprenant
        ├── ActiviteCard.tsx        ← Carte d'activité cliquable
        ├── FalcViewer.tsx          ← Affichage FALC avec étapes
        └── ProgressBar.tsx         ← Barre de progression réutilisable
```

---

## Démarrage rapide

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer les variables

```bash
cp .env.example .env
```

Éditer `.env` :
```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=            # Optionnel — voir section Supabase
VITE_SUPABASE_ANON_KEY=       # Optionnel
```

**Sans Supabase** : l'app fonctionne avec des données fictives en mémoire.  
**Avec Supabase** : la progression est sauvegardée et persistante.

### 3. Démarrer l'API (dans un autre terminal)

```bash
cd ../eclat-api
npm run dev
```

### 4. Démarrer le frontend

```bash
npm run dev
```

Ouvrir http://localhost:5173

---

## Configurer Supabase (persistance apprenant)

### Étape 1 — Créer un projet

1. Créer un compte sur [supabase.com](https://supabase.com)
2. Nouveau projet → noter l'URL et la clé anon

### Étape 2 — Créer les tables

Aller dans Supabase → SQL Editor → Coller le contenu de `supabase_schema.sql` → Run

### Étape 3 — Ajouter les clés dans .env

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## Déploiement sur Vercel

### Prérequis : l'API est déjà déployée

Vous avez besoin de l'URL de l'API (ex: `https://eclat-api.vercel.app`).

### 1. Mettre à jour vercel.json

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://eclat-api.vercel.app/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### 2. Déployer

```bash
npm install -g vercel
npm run build        # Vérifier que ça compile sans erreur
vercel               # Suivre les instructions
```

### 3. Variables d'environnement sur Vercel

Dashboard Vercel → Settings → Environment Variables :
- `VITE_API_URL` : URL de votre API
- `VITE_SUPABASE_URL` : URL Supabase
- `VITE_SUPABASE_ANON_KEY` : Clé Supabase

---

## Fonctionnalités par espace

### Espace praticien

| Fonctionnalité | Description |
|---|---|
| Recherche multicritères | Filtrer par type, domaine, niveau, profil TND, full-text |
| Panneau de détail | Consigne praticien + consigne élève + adaptations TDAH/TSA/DYS |
| Moteur de recommandations | Profil + domaine + niveau + âge → sélection automatique |
| Navigation par parcours | 6 parcours · détail de chaque phase avec contenus enrichis |
| Métriques temps réel | Stats depuis l'API (exercices, jeux, FALC, routines) |

### Espace apprenant

| Fonctionnalité | Description |
|---|---|
| Activités du jour | Chargées depuis l'API selon le profil TND de l'apprenant |
| Affichage FALC | Étapes numérotées, langage simple, bouton "J'ai fini" |
| Barre de progression | Avancement dans les activités du jour |
| Mes fiches | Fiches FALC à conserver |
| Mes progrès | Niveaux par domaine (depuis Supabase) |
| Fin de séance | Enregistrement dans Supabase |

---

*Éclat & Vous — Frontend v1.0.0*
