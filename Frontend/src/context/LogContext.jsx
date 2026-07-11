import React, { createContext, useContext, useState } from 'react';
import { mockLogs } from '../services/mockData';

const LogContext = createContext();

/**
 * Fournit un journal d'audit partagé entre tous les composants.
 * Les logs sont initialisés avec les données mock, puis enrichis en
 * temps réel par les actions administratives (création, suppression, toggle…).
 */
export const LogProvider = ({ children }) => {
  // On initialise avec les mock data, triés du plus récent au plus ancien
  const [logs, setLogs] = useState(() =>
    [...mockLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  );

  /**
   * Ajoute une entrée dans le journal d'audit.
   * @param {string} actionType  - Type d'action (ex: 'CREATE_USER')
   * @param {string} description - Description lisible de l'action
   * @param {string} [userEmail] - Email de l'acteur (optionnel, défaut: admin@cspj.ma)
   */
  const addLog = (actionType, description, userEmail = 'admin@cspj.ma') => {
    const newEntry = {
      id: Date.now(), // ID unique basé sur le timestamp
      userEmail,
      actionType,
      description,
      timestamp: new Date().toISOString(),
    };

    // Insérer en tête de liste (ordre chronologique inverse)
    setLogs(prev => [newEntry, ...prev]);
  };

  return (
    <LogContext.Provider value={{ logs, addLog }}>
      {children}
    </LogContext.Provider>
  );
};

export const useLogs = () => useContext(LogContext);
