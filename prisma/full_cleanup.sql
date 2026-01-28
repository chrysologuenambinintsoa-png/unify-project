-- Nettoyer complètement la base de données
-- À exécuter en tant que super utilisateur (postgres)

-- Supprimer toutes les tables dans l'ordre inverse des dépendances
DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS story_reactions CASCADE;
DROP TABLE IF EXISTS story_views CASCADE;
DROP TABLE IF EXISTS stories CASCADE;
DROP TABLE IF EXISTS reactions CASCADE;
DROP TABLE IF EXISTS shares CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS post_media CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS page_post_media CASCADE;
DROP TABLE IF EXISTS page_posts CASCADE;
DROP TABLE IF EXISTS group_post_media CASCADE;
DROP TABLE IF EXISTS group_posts CASCADE;
DROP TABLE IF EXISTS page_admins CASCADE;
DROP TABLE IF EXISTS page_invites CASCADE;
DROP TABLE IF EXISTS page_members CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS verification_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;

SELECT 'Toutes les tables ont été supprimées!' as "Status";
