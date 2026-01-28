-- Supprimer TOUTES les tables et séquences de la base de données unify
-- À exécuter en tant que super utilisateur (postgres)

BEGIN;

-- Obtenir et supprimer toutes les tables
DO
$$
DECLARE
    t record;
BEGIN
    FOR t IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(t.tablename) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', t.tablename;
    END LOOP;
END
$$;

-- Supprimer toutes les séquences
DO
$$
DECLARE
    s record;
BEGIN
    FOR s IN (SELECT sequencename FROM pg_sequences WHERE schemaname = 'public')
    LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS public.' || quote_ident(s.sequencename);
        RAISE NOTICE 'Dropped sequence: %', s.sequencename;
    END LOOP;
END
$$;

COMMIT;

SELECT 'Base de données complètement nettoyée!' as "Status";
