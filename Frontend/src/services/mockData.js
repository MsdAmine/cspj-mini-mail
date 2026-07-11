// =============================================================================
// MOCK DATA — Conseil Supérieur du Pouvoir Judiciaire (CSPJ)
// Données fictives réalistes pour l'espace Admin (tests & démonstration)
// =============================================================================

// ---------------------------------------------------------------------------
// 1. UTILISATEURS
// ---------------------------------------------------------------------------
export const mockUsers = [
  {
    id: 901,
    nom: "El Amrani",
    prenom: "Dr. Mohamed",
    email: "m.elamrani@cspj.ma",
    role: "Fonctionnaire",
    entrepriseNom: "CSPJ — Direction Générale",
    entrepriseId: 1,
    actif: true,
    dateCreation: "2026-06-15T08:00:00Z"
  },
  {
    id: 902,
    nom: "Bensouda",
    prenom: "Nadia",
    email: "n.bensouda@cspj.ma",
    role: "Fonctionnaire",
    entrepriseNom: "CSPJ — Secrétariat Général",
    entrepriseId: 1,
    actif: true,
    dateCreation: "2026-06-17T09:30:00Z"
  },
  {
    id: 903,
    nom: "Alami",
    prenom: "Youssef",
    email: "y.alami@ammaroc.ma",
    role: "Association",
    entrepriseNom: "Amicale des Magistrats du Maroc",
    entrepriseId: 2,
    actif: true,
    dateCreation: "2026-06-20T10:00:00Z"
  },
  {
    id: 904,
    nom: "Kadiri",
    prenom: "Fatim-Zahra",
    email: "f.kadiri@clubmagistrats.ma",
    role: "Association",
    entrepriseNom: "Club des Magistrats",
    entrepriseId: 3,
    actif: true,
    dateCreation: "2026-06-22T11:00:00Z"
  },
  {
    id: 905,
    nom: "Tazi",
    prenom: "Karim",
    email: "k.tazi@jsm.ma",
    role: "Association",
    entrepriseNom: "Jeunes Magistrats du Maroc",
    entrepriseId: 4,
    actif: false,
    dateCreation: "2026-06-25T14:00:00Z"
  },
  {
    id: 906,
    nom: "Chraibi",
    prenom: "Hassan",
    email: "h.chraibi@cspj.ma",
    role: "Fonctionnaire",
    entrepriseNom: "CSPJ — Direction des Ressources Humaines",
    entrepriseId: 1,
    actif: true,
    dateCreation: "2026-06-28T08:45:00Z"
  },
  {
    id: 907,
    nom: "Ouali",
    prenom: "Samira",
    email: "s.ouali@cspj.ma",
    role: "Fonctionnaire",
    entrepriseNom: "CSPJ — Division Informatique",
    entrepriseId: 1,
    actif: true,
    dateCreation: "2026-07-01T09:00:00Z"
  },
  {
    id: 908,
    nom: "Berrada",
    prenom: "Rachid",
    email: "r.berrada@ammaroc.ma",
    role: "Association",
    entrepriseNom: "Amicale des Magistrats du Maroc",
    entrepriseId: 2,
    actif: true,
    dateCreation: "2026-07-02T10:30:00Z"
  },
  {
    id: 909,
    nom: "Mansouri",
    prenom: "Aicha",
    email: "a.mansouri@clubmagistrats.ma",
    role: "Association",
    entrepriseNom: "Club des Magistrats",
    entrepriseId: 3,
    actif: true,
    dateCreation: "2026-07-03T11:15:00Z"
  },
  {
    id: 910,
    nom: "Lahlou",
    prenom: "Mehdi",
    email: "m.lahlou@jsm.ma",
    role: "Association",
    entrepriseNom: "Jeunes Magistrats du Maroc",
    entrepriseId: 4,
    actif: true,
    dateCreation: "2026-07-04T14:00:00Z"
  },
  {
    id: 911,
    nom: "Idrissi",
    prenom: "Zineb",
    email: "z.idrissi@cspj.ma",
    role: "Fonctionnaire",
    entrepriseNom: "CSPJ — Division Juridique",
    entrepriseId: 1,
    actif: true,
    dateCreation: "2026-07-05T08:30:00Z"
  },
  {
    id: 912,
    nom: "Benali",
    prenom: "Omar",
    email: "o.benali@cspj.ma",
    role: "Fonctionnaire",
    entrepriseNom: "CSPJ — Direction des Affaires Administratives",
    entrepriseId: 1,
    actif: false,
    dateCreation: "2026-07-06T09:15:00Z"
  },
  {
    id: 913,
    nom: "Tahiri",
    prenom: "Leila",
    email: "l.tahiri@cspj.ma",
    role: "Fonctionnaire",
    entrepriseNom: "CSPJ — Direction Générale",
    entrepriseId: 1,
    actif: true,
    dateCreation: "2026-07-07T10:00:00Z"
  },
  {
    id: 914,
    nom: "Kabbaj",
    prenom: "Yassine",
    email: "y.kabbaj@ammaroc.ma",
    role: "Association",
    entrepriseNom: "Amicale des Magistrats du Maroc",
    entrepriseId: 2,
    actif: true,
    dateCreation: "2026-07-08T11:30:00Z"
  },
  {
    id: 915,
    nom: "Zerhouni",
    prenom: "Houda",
    email: "h.zerhouni@clubmagistrats.ma",
    role: "Association",
    entrepriseNom: "Club des Magistrats",
    entrepriseId: 3,
    actif: false,
    dateCreation: "2026-07-09T14:20:00Z"
  }
];

// ---------------------------------------------------------------------------
// 2. FILS DE DISCUSSION (THREADS) — Juillet 2026
// ---------------------------------------------------------------------------
export const mockThreads = [
  {
    id: 101,
    objet: "Validation du rapport sur les indicateurs de performance T2",
    expediteur: "Dr. Mohamed El Amrani",
    expediteurEmail: "m.elamrani@cspj.ma",
    destinataire: "Amicale des Magistrats du Maroc",
    destinataireEmail: "y.alami@ammaroc.ma",
    date: "2026-07-11T14:32:00Z",
    statutLecture: "Non lu",
    statutAcheminement: "En cours",
    hasAttachment: false,
    pieceJointeNom: ""
  },
  {
    id: 102,
    objet: "Demande de report de la réunion bilatérale",
    expediteur: "Youssef Alami",
    expediteurEmail: "y.alami@ammaroc.ma",
    destinataire: "Secrétariat Général CSPJ",
    destinataireEmail: "n.bensouda@cspj.ma",
    date: "2026-07-10T10:15:00Z",
    statutLecture: "Lu",
    statutAcheminement: "Clôturé",
    hasAttachment: false,
    pieceJointeNom: ""
  },
  {
    id: 103,
    objet: "Envoi des listes des magistrats participants au séminaire",
    expediteur: "Fatim-Zahra Kadiri",
    expediteurEmail: "f.kadiri@clubmagistrats.ma",
    destinataire: "DRH CSPJ",
    destinataireEmail: "h.chraibi@cspj.ma",
    date: "2026-07-09T16:22:00Z",
    statutLecture: "Lu",
    statutAcheminement: "En cours",
    hasAttachment: true,
    pieceJointeNom: "liste_participants.pdf"
  },
  {
    id: 104,
    objet: "Circulaire interne n°4 — Mise à jour des procédures d'évaluation",
    expediteur: "Nadia Bensouda",
    expediteurEmail: "n.bensouda@cspj.ma",
    destinataire: "Club des Magistrats",
    destinataireEmail: "f.kadiri@clubmagistrats.ma",
    date: "2026-07-11T11:05:00Z",
    statutLecture: "Non lu",
    statutAcheminement: "En cours",
    hasAttachment: true,
    pieceJointeNom: "circulaire_04_2026.pdf"
  },
  {
    id: 105,
    objet: "Compte rendu de la session plénière du 05 juillet 2026",
    expediteur: "Zineb Idrissi",
    expediteurEmail: "z.idrissi@cspj.ma",
    destinataire: "Amicale des Magistrats du Maroc",
    destinataireEmail: "r.berrada@ammaroc.ma",
    date: "2026-07-08T09:45:00Z",
    statutLecture: "Lu",
    statutAcheminement: "Clôturé",
    hasAttachment: true,
    pieceJointeNom: "cr_session_pleniere_050726.docx"
  },
  {
    id: 106,
    objet: "Demande d'accès au registre des décisions judiciaires",
    expediteur: "Rachid Berrada",
    expediteurEmail: "r.berrada@ammaroc.ma",
    destinataire: "Division Juridique CSPJ",
    destinataireEmail: "z.idrissi@cspj.ma",
    date: "2026-07-07T15:30:00Z",
    statutLecture: "Lu",
    statutAcheminement: "En cours",
    hasAttachment: false,
    pieceJointeNom: ""
  },
  {
    id: 107,
    objet: "Programme prévisionnel des formations magistrats — S2 2026",
    expediteur: "Hassan Chraibi",
    expediteurEmail: "h.chraibi@cspj.ma",
    destinataire: "Jeunes Magistrats du Maroc",
    destinataireEmail: "m.lahlou@jsm.ma",
    date: "2026-07-06T13:00:00Z",
    statutLecture: "Non lu",
    statutAcheminement: "En cours",
    hasAttachment: true,
    pieceJointeNom: "programme_formations_S2_2026.xlsx"
  },
  {
    id: 108,
    objet: "Transmission du rapport annuel d'activité 2025",
    expediteur: "Dr. Mohamed El Amrani",
    expediteurEmail: "m.elamrani@cspj.ma",
    destinataire: "Club des Magistrats",
    destinataireEmail: "a.mansouri@clubmagistrats.ma",
    date: "2026-07-05T10:20:00Z",
    statutLecture: "Lu",
    statutAcheminement: "Clôturé",
    hasAttachment: true,
    pieceJointeNom: "rapport_annuel_2025.pdf"
  },
  {
    id: 109,
    objet: "Notification de mise en ligne du nouveau portail membres",
    expediteur: "Samira Ouali",
    expediteurEmail: "s.ouali@cspj.ma",
    destinataire: "Amicale des Magistrats du Maroc",
    destinataireEmail: "y.kabbaj@ammaroc.ma",
    date: "2026-07-04T08:55:00Z",
    statutLecture: "Lu",
    statutAcheminement: "Clôturé",
    hasAttachment: false,
    pieceJointeNom: ""
  },
  {
    id: 110,
    objet: "Demande de clarification sur l'article 47 du règlement intérieur",
    expediteur: "Mehdi Lahlou",
    expediteurEmail: "m.lahlou@jsm.ma",
    destinataire: "Division Juridique CSPJ",
    destinataireEmail: "z.idrissi@cspj.ma",
    date: "2026-07-03T14:10:00Z",
    statutLecture: "Non lu",
    statutAcheminement: "En cours",
    hasAttachment: false,
    pieceJointeNom: ""
  }
];

// ---------------------------------------------------------------------------
// 3. JOURNAL D'AUDIT — Logs d'activité (sans contenu de message)
// ---------------------------------------------------------------------------
export const mockLogs = [
  {
    id: 501,
    userEmail: "m.elamrani@cspj.ma",
    actionType: "SEND_MESSAGE",
    description: "L'utilisateur m.elamrani@cspj.ma a initié un nouveau fil de discussion intitulé 'Circulaire interne n°4' vers l'Association Club des Magistrats.",
    timestamp: "2026-07-11T14:32:00Z"
  },
  {
    id: 502,
    userEmail: "admin@cspj.ma",
    actionType: "TOGGLE_USER_STATUS",
    description: "L'administrateur a modifié le statut du compte k.tazi@jsm.ma de 'Actif' à 'Inactif'.",
    timestamp: "2026-07-11T15:05:00Z"
  },
  {
    id: 503,
    userEmail: "f.kadiri@clubmagistrats.ma",
    actionType: "UPLOAD_ATTACHMENT",
    description: "L'utilisateur f.kadiri@clubmagistrats.ma a téléversé une pièce jointe (ID_File: 8974) rattachée à la discussion 'Séminaire de formation'.",
    timestamp: "2026-07-11T15:12:00Z"
  },
  {
    id: 504,
    userEmail: "admin@cspj.ma",
    actionType: "DELETE_USER",
    description: "L'administrateur a définitivement supprimé le compte temporaire stagiaire.test@cspj.ma du système.",
    timestamp: "2026-07-11T16:22:00Z"
  },
  {
    id: 505,
    userEmail: "n.bensouda@cspj.ma",
    actionType: "ARCHIVE_DISCUSSION",
    description: "L'utilisateur n.bensouda@cspj.ma a archivé le fil de discussion 'Planning Réunions Mai'.",
    timestamp: "2026-07-11T17:00:00Z"
  },
  {
    id: 506,
    userEmail: "z.idrissi@cspj.ma",
    actionType: "SEND_MESSAGE",
    description: "L'utilisateur z.idrissi@cspj.ma a transmis le compte rendu de la session plénière du 05/07/2026 à l'Amicale des Magistrats (fil #105).",
    timestamp: "2026-07-08T09:50:00Z"
  },
  {
    id: 507,
    userEmail: "admin@cspj.ma",
    actionType: "CREATE_USER",
    description: "L'administrateur a créé un nouveau compte utilisateur pour Leila Tahiri (l.tahiri@cspj.ma) avec le rôle Fonctionnaire.",
    timestamp: "2026-07-07T08:10:00Z"
  },
  {
    id: 508,
    userEmail: "h.chraibi@cspj.ma",
    actionType: "UPLOAD_ATTACHMENT",
    description: "L'utilisateur h.chraibi@cspj.ma a téléversé une pièce jointe (ID_File: 9012) rattachée à la discussion 'Programme formations magistrats S2 2026' (fil #107).",
    timestamp: "2026-07-06T13:05:00Z"
  },
  {
    id: 509,
    userEmail: "r.berrada@ammaroc.ma",
    actionType: "SEND_MESSAGE",
    description: "L'utilisateur r.berrada@ammaroc.ma a envoyé une demande d'accès au registre des décisions judiciaires à la Division Juridique CSPJ (fil #106).",
    timestamp: "2026-07-07T15:35:00Z"
  },
  {
    id: 510,
    userEmail: "admin@cspj.ma",
    actionType: "TOGGLE_USER_STATUS",
    description: "L'administrateur a réactivé le compte o.benali@cspj.ma, précédemment suspendu pour inactivité prolongée.",
    timestamp: "2026-07-06T11:00:00Z"
  },
  {
    id: 511,
    userEmail: "s.ouali@cspj.ma",
    actionType: "SEND_MESSAGE",
    description: "L'utilisateur s.ouali@cspj.ma a notifié l'Amicale des Magistrats (y.kabbaj@ammaroc.ma) de la mise en ligne du nouveau portail membres (fil #109).",
    timestamp: "2026-07-04T09:00:00Z"
  },
  {
    id: 512,
    userEmail: "admin@cspj.ma",
    actionType: "ARCHIVE_DISCUSSION",
    description: "L'administrateur a archivé la discussion 'Rapport Annuel 2025' après clôture confirmée par les deux parties.",
    timestamp: "2026-07-05T17:45:00Z"
  },
  {
    id: 513,
    userEmail: "y.alami@ammaroc.ma",
    actionType: "SEND_MESSAGE",
    description: "L'utilisateur y.alami@ammaroc.ma a soumis une demande de report de la réunion bilatérale au Secrétariat Général CSPJ (fil #102).",
    timestamp: "2026-07-10T10:18:00Z"
  },
  {
    id: 514,
    userEmail: "admin@cspj.ma",
    actionType: "TOGGLE_USER_STATUS",
    description: "L'administrateur a désactivé le compte h.zerhouni@clubmagistrats.ma suite à une demande de sortie de l'association.",
    timestamp: "2026-07-09T16:30:00Z"
  },
  {
    id: 515,
    userEmail: "m.lahlou@jsm.ma",
    actionType: "SEND_MESSAGE",
    description: "L'utilisateur m.lahlou@jsm.ma a adressé une demande de clarification sur l'article 47 du règlement intérieur à la Division Juridique CSPJ (fil #110).",
    timestamp: "2026-07-03T14:15:00Z"
  }
];
