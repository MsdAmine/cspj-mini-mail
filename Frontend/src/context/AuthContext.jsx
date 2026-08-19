import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await api.get('/auth/me');
        setUser(response.data);
        localStorage.setItem('cspj_user', JSON.stringify(response.data));
      } catch (error) {
        setUser(null);
        localStorage.removeItem('cspj_user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password: password
      });

      if (response.data.requiresTwoFactor) {
        return {
          requiresTwoFactor: true,
          email: response.data.email,
          twoFactorSecret: response.data.twoFactorSecret ?? '',
          isFirstTimeSetup: response.data.isFirstTimeSetup ?? false
        };
      }

      // If login directly returns user (though currently backend expects 2FA), handle it here
      const { email: userEmail, nom, prenom, role, id, institutionId } = response.data;
      
      const userProfile = {
        id,
        email: userEmail,
        nom,
        prenom,
        role,
        institutionId
      };

      localStorage.setItem('cspj_user', JSON.stringify(userProfile));
      setUser(userProfile);
      return userProfile;

    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 400)) {
        const msg = error.response.data?.message || error.response.data;
        throw new Error(typeof msg === 'string' ? msg : "INVALID_CREDENTIALS");
      }
      throw new Error(error.response?.data?.message || error.response?.data || "SERVER_ERROR");
    }
  };

  const verifyTwoFactor = async (email, code) => {
    try {
      const response = await api.post('/auth/verify-2fa', { email, code });
      // The cookie is now set automatically by the backend.
      // We also need the user's ID and institutionId, but they might not be in the verify-2fa response body.
      // Let's fetch the profile via /auth/me to ensure we have the complete user data.
      const meResponse = await api.get('/auth/me');
      const userProfile = meResponse.data;

      localStorage.setItem('cspj_user', JSON.stringify(userProfile));
      setUser(userProfile);
      return userProfile;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        throw new Error("INVALID_CODE");
      }
      throw new Error(error.response?.data?.message || error.response?.data || "SERVER_ERROR");
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem('cspj_user');
      setUser(null);
    }
  };

  const adminCreateUser = async (newUserData) => {
    try {
      const response = await api.post('/admin/users', newUserData);
      return response.data;
    } catch (error) {
      const errorMessage = typeof error.response?.data === 'string' 
        ? error.response.data 
        : error.response?.data?.message || "Erreur lors de la création du compte.";
      throw new Error(errorMessage);
    }
  };

  const updateProfile = async ({ prenom, nom, email, telephone }) => {
    try {
      const response = await api.put('/auth/profile', { prenom, nom, email, telephone });
      const updated = response.data;

      const updatedUser = {
        ...user,
        prenom:        updated.prenom,
        nom:           updated.nom,
        email:         updated.email,
        telephone:     updated.telephone ?? null,
        nomEntreprise: updated.nomEntreprise ?? user?.nomEntreprise ?? null,
      };

      localStorage.setItem('cspj_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      const errorMessage = typeof error.response?.data === 'string'
        ? error.response.data
        : error.response?.data?.message || "Erreur lors de la mise à jour du profil.";
      throw new Error(errorMessage);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, verifyTwoFactor, logout, loading, adminCreateUser, updateProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);