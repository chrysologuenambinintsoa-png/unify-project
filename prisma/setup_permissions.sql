-- Accorder les permissions complètes à unify_user sur toutes les tables et séquences
-- À exécuter en tant que super utilisateur (postgres)

-- Accorder tous les droits sur le schéma public
GRANT ALL PRIVILEGES ON SCHEMA public TO unify_user;

-- Accorder tous les droits sur toutes les tables
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO unify_user;

-- Accorder tous les droits sur toutes les séquences
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO unify_user;

-- Accorder les droits par défaut pour les nouvelles tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO unify_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO unify_user;

-- Appliquer les droits sur toutes les tables existantes
DO
$$
DECLARE
    t record;
BEGIN
    FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(t.tablename) || ' OWNER TO unify_user';
    END LOOP;
END
$$;

SELECT 'Permissions configurées avec succès!' as "Status";
