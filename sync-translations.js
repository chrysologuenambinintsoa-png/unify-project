#!/usr/bin/env node

/**
 * Script pour synchroniser et compléter les traductions
 * Ajoute les clés manquantes basées sur FR.json (langue maître)
 */

const fs = require('fs');
const path = require('path');

const translationsDir = path.join(__dirname, 'lib', 'translations');
const languages = ['en', 'es', 'de', 'mg', 'ch', 'pt', 'it', 'ar', 'hi'];

// Configurations de traduction pour les clés manquantes
const MISSING_TRANSLATIONS = {
  en: {
    "settingsPage.sections": {
      "accountManagement": "Account Management",
      "generalSettings": "General Settings"
    },
    "forms.gender": {
      "male": "Male",
      "female": "Female",
      "other": "Other"
    },
    "locations": {
      "paris": "Paris",
      "london": "London",
      "newYork": "New York",
      "tokyo": "Tokyo",
      "sydney": "Sydney"
    },
    "ui.buttons": {
      "visit": "Visit",
      "contact": "Contact",
      "cancel": "Cancel",
      "creating": "Creating...",
      "publishing": "Publishing...",
      "loading": "Loading..."
    },
    "ui.labels": {
      "conversions": "Conversions",
      "impressions": "Impressions",
      "clicks": "Clicks",
      "animation": "Animation",
      "pageName": "Page Name",
      "tagPeople": "Tag People",
      "searchAndAdd": "Search and add people...",
      "publications": "Publications",
      "followers": "Followers"
    },
    "company": {
      "visit": "Visit",
      "contact": "Contact"
    }
  },
  fr: {
    "settingsPage.sections": {
      "accountManagement": "Gestion de compte",
      "generalSettings": "Paramètres généraux"
    },
    "forms.gender": {
      "male": "Homme",
      "female": "Femme",
      "other": "Autre"
    },
    "locations": {
      "paris": "Paris",
      "london": "Londres",
      "newYork": "New York",
      "tokyo": "Tokyo",
      "sydney": "Sydney"
    },
    "ui.buttons": {
      "visit": "Visiter",
      "contact": "Contacter",
      "cancel": "Annuler",
      "creating": "Création...",
      "publishing": "Publication...",
      "loading": "Chargement..."
    },
    "ui.labels": {
      "conversions": "Conversions",
      "impressions": "Impressions",
      "clicks": "Clics",
      "animation": "Animation",
      "pageName": "Nom de la page",
      "tagPeople": "Baliser des personnes",
      "searchAndAdd": "Rechercher et ajouter des personnes...",
      "publications": "Publications",
      "followers": "Abonnés"
    },
    "company": {
      "visit": "Visiter",
      "contact": "Contacter"
    }
  },
  es: {
    "settingsPage.sections": {
      "accountManagement": "Gestión de cuenta",
      "generalSettings": "Configuración general"
    },
    "forms.gender": {
      "male": "Hombre",
      "female": "Mujer",
      "other": "Otro"
    },
    "locations": {
      "paris": "París",
      "london": "Londres",
      "newYork": "Nueva York",
      "tokyo": "Tokio",
      "sydney": "Sídney"
    },
    "ui.buttons": {
      "visit": "Visitar",
      "contact": "Contactar",
      "cancel": "Cancelar",
      "creating": "Creando...",
      "publishing": "Publicando...",
      "loading": "Cargando..."
    },
    "ui.labels": {
      "conversions": "Conversiones",
      "impressions": "Impresiones",
      "clicks": "Clics",
      "animation": "Animación",
      "pageName": "Nombre de la página",
      "tagPeople": "Etiquetar personas",
      "searchAndAdd": "Buscar y agregar personas...",
      "publications": "Publicaciones",
      "followers": "Seguidores"
    },
    "company": {
      "visit": "Visitar",
      "contact": "Contactar"
    }
  },
  de: {
    "settingsPage.sections": {
      "accountManagement": "Kontoverwaltung",
      "generalSettings": "Allgemeine Einstellungen"
    },
    "forms.gender": {
      "male": "Männlich",
      "female": "Weiblich",
      "other": "Sonstiges"
    },
    "locations": {
      "paris": "Paris",
      "london": "London",
      "newYork": "New York",
      "tokyo": "Tokio",
      "sydney": "Sydney"
    },
    "ui.buttons": {
      "visit": "Besuchen",
      "contact": "Kontakt",
      "cancel": "Abbrechen",
      "creating": "Wird erstellt...",
      "publishing": "Wird veröffentlicht...",
      "loading": "Wird geladen..."
    },
    "ui.labels": {
      "conversions": "Konversionen",
      "impressions": "Impressionen",
      "clicks": "Klicks",
      "animation": "Animation",
      "pageName": "Seitenname",
      "tagPeople": "Personen markieren",
      "searchAndAdd": "Personen suchen und hinzufügen...",
      "publications": "Veröffentlichungen",
      "followers": "Follower"
    },
    "company": {
      "visit": "Besuchen",
      "contact": "Kontakt"
    }
  },
  mg: {
    "settingsPage.sections": {
      "accountManagement": "Fitantanana kaonty",
      "generalSettings": "Mombamomba amin'ny ankapobeny"
    },
    "forms.gender": {
      "male": "Lahy",
      "female": "Vavy",
      "other": "Hafa"
    },
    "locations": {
      "paris": "Paris",
      "london": "Londres",
      "newYork": "New York",
      "tokyo": "Tokyo",
      "sydney": "Sydney"
    },
    "ui.buttons": {
      "visit": "Fifanaliana",
      "contact": "Fifandraisana",
      "cancel": "Foanana",
      "creating": "Miforona...",
      "publishing": "Nansitraka...",
      "loading": "Mikatraho..."
    },
    "ui.labels": {
      "conversions": "Famadihana",
      "impressions": "Fahitana",
      "clicks": "Fitsapitsapian'ny toko",
      "animation": "Fihetsiketsehana",
      "pageName": "Anarana pejy",
      "tagPeople": "Soratin'ny asa",
      "searchAndAdd": "Tarohy sy hampiditra olona...",
      "publications": "Navoaka",
      "followers": "Manaraka"
    },
    "company": {
      "visit": "Fifanaliana",
      "contact": "Fifandraisana"
    }
  },
  ch: {
    "settingsPage.sections": {
      "accountManagement": "账户管理",
      "generalSettings": "常规设置"
    },
    "forms.gender": {
      "male": "男性",
      "female": "女性",
      "other": "其他"
    },
    "locations": {
      "paris": "巴黎",
      "london": "伦敦",
      "newYork": "纽约",
      "tokyo": "东京",
      "sydney": "悉尼"
    },
    "ui.buttons": {
      "visit": "访问",
      "contact": "联系",
      "cancel": "取消",
      "creating": "创建中...",
      "publishing": "发布中...",
      "loading": "加载中..."
    },
    "ui.labels": {
      "conversions": "转化",
      "impressions": "展现",
      "clicks": "点击",
      "animation": "动画",
      "pageName": "页面名称",
      "tagPeople": "标记人员",
      "searchAndAdd": "搜索并添加人员...",
      "publications": "出版物",
      "followers": "追随者"
    },
    "company": {
      "visit": "访问",
      "contact": "联系"
    }
  },
  pt: {
    "settingsPage.sections": {
      "accountManagement": "Gerenciamento de conta",
      "generalSettings": "Configurações gerais"
    },
    "forms.gender": {
      "male": "Masculino",
      "female": "Feminino",
      "other": "Outro"
    },
    "locations": {
      "paris": "Paris",
      "london": "Londres",
      "newYork": "Nova York",
      "tokyo": "Tóquio",
      "sydney": "Sydney"
    },
    "ui.buttons": {
      "visit": "Visitar",
      "contact": "Contato",
      "cancel": "Cancelar",
      "creating": "Criando...",
      "publishing": "Publicando...",
      "loading": "Carregando..."
    },
    "ui.labels": {
      "conversions": "Conversões",
      "impressions": "Impressões",
      "clicks": "Cliques",
      "animation": "Animação",
      "pageName": "Nome da página",
      "tagPeople": "Marcar pessoas",
      "searchAndAdd": "Procurar e adicionar pessoas...",
      "publications": "Publicações",
      "followers": "Seguidores"
    },
    "company": {
      "visit": "Visitar",
      "contact": "Contato"
    }
  },
  it: {
    "settingsPage.sections": {
      "accountManagement": "Gestione account",
      "generalSettings": "Impostazioni generali"
    },
    "forms.gender": {
      "male": "Maschio",
      "female": "Femmina",
      "other": "Altro"
    },
    "locations": {
      "paris": "Parigi",
      "london": "Londra",
      "newYork": "New York",
      "tokyo": "Tokyo",
      "sydney": "Sydney"
    },
    "ui.buttons": {
      "visit": "Visita",
      "contact": "Contatto",
      "cancel": "Annulla",
      "creating": "Creazione...",
      "publishing": "Pubblicazione...",
      "loading": "Caricamento..."
    },
    "ui.labels": {
      "conversions": "Conversioni",
      "impressions": "Impressioni",
      "clicks": "Clic",
      "animation": "Animazione",
      "pageName": "Nome pagina",
      "tagPeople": "Etichetta persone",
      "searchAndAdd": "Cerca e aggiungi persone...",
      "publications": "Pubblicazioni",
      "followers": "Follower"
    },
    "company": {
      "visit": "Visita",
      "contact": "Contatto"
    }
  },
  ar: {
    "settingsPage.sections": {
      "accountManagement": "إدارة الحساب",
      "generalSettings": "الإعدادات العامة"
    },
    "forms.gender": {
      "male": "ذكر",
      "female": "أنثى",
      "other": "آخر"
    },
    "locations": {
      "paris": "باريس",
      "london": "لندن",
      "newYork": "نيويورك",
      "tokyo": "طوكيو",
      "sydney": "سيدني"
    },
    "ui.buttons": {
      "visit": "زيارة",
      "contact": "اتصال",
      "cancel": "إلغاء",
      "creating": "جاري الإنشاء...",
      "publishing": "جاري النشر...",
      "loading": "جاري التحميل..."
    },
    "ui.labels": {
      "conversions": "التحويلات",
      "impressions": "الانطباعات",
      "clicks": "النقرات",
      "animation": "الرسوم المتحركة",
      "pageName": "اسم الصفحة",
      "tagPeople": "وسم الأشخاص",
      "searchAndAdd": "البحث عن الأشخاص وإضافتهم...",
      "publications": "المنشورات",
      "followers": "المتابعون"
    },
    "company": {
      "visit": "زيارة",
      "contact": "اتصال"
    }
  },
  hi: {
    "settingsPage.sections": {
      "accountManagement": "खाता प्रबंधन",
      "generalSettings": "सामान्य सेटिंग्स"
    },
    "forms.gender": {
      "male": "पुरुष",
      "female": "महिला",
      "other": "अन्य"
    },
    "locations": {
      "paris": "पेरिस",
      "london": "लंदन",
      "newYork": "न्यूयॉर्क",
      "tokyo": "टोक्यो",
      "sydney": "सिडनी"
    },
    "ui.buttons": {
      "visit": "जाएं",
      "contact": "संपर्क करें",
      "cancel": "रद्द करें",
      "creating": "बना रहे हैं...",
      "publishing": "प्रकाशित कर रहे हैं...",
      "loading": "लोड हो रहा है..."
    },
    "ui.labels": {
      "conversions": "रूपांतरण",
      "impressions": "इंप्रेशन",
      "clicks": "क्लिक",
      "animation": "एनिमेशन",
      "pageName": "पृष्ठ का नाम",
      "tagPeople": "लोगों को टैग करें",
      "searchAndAdd": "लोगों को खोजें और जोड़ें...",
      "publications": "प्रकाशन",
      "followers": "अनुसरण करने वाले"
    },
    "company": {
      "visit": "जाएं",
      "contact": "संपर्क करें"
    }
  }
};

function setNestedValue(obj, path, value) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
}

function syncTranslations() {
  console.log('\n📝 Synchronisation des traductions...\n');

  languages.forEach(lang => {
    const filePath = path.join(translationsDir, `${lang}.json`);
    
    try {
      let translations = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      let updated = false;

      if (MISSING_TRANSLATIONS[lang]) {
        Object.entries(MISSING_TRANSLATIONS[lang]).forEach(([section, values]) => {
          Object.entries(values).forEach(([key, translation]) => {
            setNestedValue(translations, `${section}.${key}`, translation);
            updated = true;
          });
        });
      }

      if (updated) {
        fs.writeFileSync(filePath, JSON.stringify(translations, null, 2) + '\n');
        console.log(`✅ ${lang.toUpperCase()}: Traductions mises à jour`);
      } else {
        console.log(`⏭️  ${lang.toUpperCase()}: Aucune mise à jour nécessaire`);
      }
    } catch (error) {
      console.error(`❌ ${lang.toUpperCase()}: Erreur - ${error.message}`);
    }
  });

  console.log('\n✨ Synchronisation terminée!\n');
}

syncTranslations();
