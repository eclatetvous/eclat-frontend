-- ============================================================
-- Éclat & Vous — Schéma Supabase v2
-- Console de suivi praticien complète
-- Coller dans Supabase > SQL Editor > Run
-- ============================================================

-- ── Tables existantes (drop si besoin de repartir) ──────────
-- DROP TABLE IF EXISTS affectations CASCADE;
-- DROP TABLE IF EXISTS evaluations_passees CASCADE;
-- DROP TABLE IF EXISTS scores CASCADE;
-- DROP TABLE IF EXISTS sessions CASCADE;
-- DROP TABLE IF EXISTS apprenants CASCADE;

-- ── APPRENANTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS apprenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom        VARCHAR(50) NOT NULL,
  nom           VARCHAR(50),
  age_mois      SMALLINT NOT NULL,
  date_naissance DATE,
  profils_tnd   TEXT[] NOT NULL DEFAULT '{}',
  niveau_classe VARCHAR(30),
  notes         TEXT,
  praticien_id  UUID,  -- pour filtrer par praticien (multi-utilisateur futur)
  actif         BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── EVALUATIONS PASSÉES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS evaluations_passees (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprenant_id     UUID REFERENCES apprenants(id) ON DELETE CASCADE,
  evaluation_id    VARCHAR(20) NOT NULL,   -- ex: EV-ATT-001
  domaine_id       VARCHAR(8)  NOT NULL,
  titre_evaluation VARCHAR(200),
  date_passation   DATE NOT NULL,
  score_brut       DECIMAL(8,2),
  percentile       SMALLINT,
  statut           VARCHAR(15) CHECK (statut IN ('normal','limite','clinique')) DEFAULT 'normal',
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── SCORES PAR DOMAINE (niveau actuel) ──────────────────────
CREATE TABLE IF NOT EXISTS scores (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprenant_id   UUID REFERENCES apprenants(id) ON DELETE CASCADE,
  domaine_id     VARCHAR(8) NOT NULL,
  niveau         SMALLINT NOT NULL CHECK (niveau BETWEEN 1 AND 4),
  score_brut     DECIMAL(8,2),
  date_passation DATE NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── AFFECTATIONS (exercices/parcours/FALC affectés) ─────────
CREATE TABLE IF NOT EXISTS affectations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprenant_id   UUID REFERENCES apprenants(id) ON DELETE CASCADE,
  contenu_id     VARCHAR(30) NOT NULL,   -- ex: EX-ATT-001 ou PAR-TDAH
  type_contenu   VARCHAR(20) CHECK (type_contenu IN ('exercice','evaluation','jeu','falc','routine','parcours')),
  titre          VARCHAR(200),
  domaine_id     VARCHAR(8),
  statut         VARCHAR(20) CHECK (statut IN ('affecte','en_cours','termine','reporte')) DEFAULT 'affecte',
  date_affectation DATE DEFAULT CURRENT_DATE,
  date_debut     DATE,
  date_fin       DATE,
  notes          TEXT,
  priorite       SMALLINT DEFAULT 2 CHECK (priorite BETWEEN 1 AND 3),  -- 1=haute 2=normale 3=basse
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── SESSIONS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprenant_id     UUID REFERENCES apprenants(id) ON DELETE CASCADE,
  date_session     DATE NOT NULL,
  duree_min        SMALLINT,
  domaines_traites TEXT[] DEFAULT '{}',
  exercices_ids    TEXT[] DEFAULT '{}',
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEX ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ev_passees_apprenant  ON evaluations_passees(apprenant_id);
CREATE INDEX IF NOT EXISTS idx_ev_passees_domaine    ON evaluations_passees(domaine_id);
CREATE INDEX IF NOT EXISTS idx_scores_apprenant      ON scores(apprenant_id);
CREATE INDEX IF NOT EXISTS idx_affectations_apprenant ON affectations(apprenant_id);
CREATE INDEX IF NOT EXISTS idx_affectations_statut   ON affectations(statut);
CREATE INDEX IF NOT EXISTS idx_sessions_apprenant    ON sessions(apprenant_id);

-- ── ROW LEVEL SECURITY ────────────────────────────────────────
ALTER TABLE apprenants           ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations_passees  ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores               ENABLE ROW LEVEL SECURITY;
ALTER TABLE affectations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions             ENABLE ROW LEVEL SECURITY;

-- Accès public (mode démo — à restreindre en prod avec auth)
CREATE POLICY "public_apprenants"     ON apprenants           FOR ALL USING (true);
CREATE POLICY "public_ev_passees"     ON evaluations_passees  FOR ALL USING (true);
CREATE POLICY "public_scores"         ON scores               FOR ALL USING (true);
CREATE POLICY "public_affectations"   ON affectations         FOR ALL USING (true);
CREATE POLICY "public_sessions"       ON sessions             FOR ALL USING (true);

-- ── DONNÉES DÉMO ─────────────────────────────────────────────
INSERT INTO apprenants (id, prenom, nom, age_mois, profils_tnd, niveau_classe)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Léa',    'Martin', 108, ARRAY['TDAH'],    'CM1'),
  ('00000000-0000-0000-0000-000000000002', 'Thomas', 'Dupont', 120, ARRAY['TSA'],     'CM2'),
  ('00000000-0000-0000-0000-000000000003', 'Emma',   'Petit',  96,  ARRAY['DYS_LEX'],'CE2')
ON CONFLICT (id) DO NOTHING;

INSERT INTO scores (apprenant_id, domaine_id, niveau, date_passation)
VALUES
  ('00000000-0000-0000-0000-000000000001','ATT',2,CURRENT_DATE),
  ('00000000-0000-0000-0000-000000000001','INH',1,CURRENT_DATE),
  ('00000000-0000-0000-0000-000000000001','MDT',1,CURRENT_DATE),
  ('00000000-0000-0000-0000-000000000002','FLX',1,CURRENT_DATE),
  ('00000000-0000-0000-0000-000000000002','SEN',1,CURRENT_DATE),
  ('00000000-0000-0000-0000-000000000002','EMO',2,CURRENT_DATE),
  ('00000000-0000-0000-0000-000000000003','LEC',1,CURRENT_DATE),
  ('00000000-0000-0000-0000-000000000003','VIT',1,CURRENT_DATE),
  ('00000000-0000-0000-0000-000000000003','MDT',2,CURRENT_DATE)
ON CONFLICT DO NOTHING;

SELECT '✓ Schéma v2 Éclat & Vous créé avec succès' AS message;
