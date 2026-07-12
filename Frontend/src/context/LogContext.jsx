import React, { createContext, useContext } from 'react';
import api from '../services/api';

const LogContext = createContext();

/**
 * Fournit un journal d'audit partagé entre tous les composants.
 * Chaque appel à addLog persiste l'entrée en base via POST /api/admin/audit-logs.
 */
export const LogProvider = ({ children }) => {

  /**
   * Persiste une entrée dans le journal d'audit (backend + DB).
   * @param {string} typeAction  - Type d'action (ex: 'CREATE_USER')
   * @param {string} description - Description lisible de l'action
   * @param {string} [userEmail] - Email de l'acteur (optionnel)
   */
  const addLog = async (typeAction, description, userEmail = 'admin@cspj.ma') => {
    try {
      await api.post('/admin/audit-logs', {
        typeAction,
        utilisateur: userEmail,
        description,
      });
    } catch (err) {
      // Fail silently — audit log persistence is non-critical
      console.warn('[AuditLog] Failed to persist log entry:', err?.message);
    }
  };

  return (
    <LogContext.Provider value={{ addLog }}>
      {children}
    </LogContext.Provider>
  );
};

export const useLogs = () => useContext(LogContext);

