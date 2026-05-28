-- Éclat & Vous — Schéma Supabase
-- Coller ce SQL dans Supabase > SQL Editor > New Query > Run

-- Apprenants
CREATE TABLE IF NOT EXISTS apprenants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiales    VARCHAR(20) NOT NULL,
  age_mois     SMALLINT NOT NULL,
  profils_tnd  TEXT[] NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprenant_id     UUID REFERENCES apprenants(id) ON DELETE CASCADE,
  date_session     DATE NOT NULL,
  domaines_traites TEXT[] DEFAULT '{}',
  exercices_ids    TEXT[] DEFAULT '{}',
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Scores
CREATE TABLE IF NOT EXISTS scores (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprenant_id   UUID REFERENCES apprenants(id) ON DELETE CASCADE,
  domaine_id     VARCHAR(8) NOT NULL,
  niveau         SMALLINT NOT NULL CHECK (niveau BETWEEN 1 AND 4),
  score_brut     DECIMAL(8,2),
  date_passation DATE NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_sessions_apprenant ON sessions(apprenant_id);
CREATE INDEX IF NOT EXISTS idx_scores_apprenant ON scores(apprenant_id);
CREATE INDEX IF NOT EXISTS idx_scores_domaine ON scores(domaine_id);

-- Row Level Security (recommandé)
ALTER TABLE apprenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores     ENABLE ROW LEVEL SECURITY;

-- Politique : accès libre avec anon key pour le mode demo
-- (à restreindre en production avec auth)
CREATE POLICY "public_access_apprenants" ON apprenants FOR ALL USING (true);
CREATE POLICY "public_access_sessions"   ON sessions   FOR ALL USING (true);
CREATE POLICY "public_access_scores"     ON scores     FOR ALL USING (true);

-- Données demo
INSERT INTO apprenants (id, initiales, age_mois, profils_tnd)
VALUES ('00000000-0000-0000-0000-000000000001', 'Léa', 108, ARRAY['TDAH'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO scores (apprenant_id, domaine_id, niveau, date_passation)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'ATT', 2, CURRENT_DATE),
  ('00000000-0000-0000-0000-000000000001', 'INH', 1, CURRENT_DATE),
  ('00000000-0000-0000-0000-000000000001', 'MDT', 1, CURRENT_DATE)
ON CONFLICT DO NOTHING;

SELECT '✓ Schéma Supabase créé avec succès' AS message;
