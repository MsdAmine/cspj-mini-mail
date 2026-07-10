import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = () => {
      const token = localStorage.getItem('cspj_token');
      const savedUser = localStorage.getItem('cspj_user');
      
      if (token && savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        localStorage.removeItem('cspj_token');
        localStorage.removeItem('cspj_user');
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email: email.trim(),
        password: password
      });

      // The backend returns: { token, email, nom, prenom, role }
      const { token, email: userEmail, nom, prenom, role } = response.data;
      
      const decoded = parseJwt(token);
      const userId = decoded ? parseInt(decoded["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"], 10) : null;
      const entrepriseId = decoded ? parseInt(decoded["EntrepriseId"], 10) : null;

      const userProfile = {
        id: userId,
        email: userEmail,
        nom,
        prenom,
        role,
        entrepriseId
      };

      localStorage.setItem('cspj_token', token);
      localStorage.setItem('cspj_user', JSON.stringify(userProfile));
      
      setUser(userProfile);
      return userProfile;

    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 400)) {
        throw new Error("Identifiant ou mot de passe incorrect.");
      }
      throw new Error(error.response?.data || "Erreur de connexion au serveur.");
    }
  };

  const logout = () => {
    localStorage.removeItem('cspj_token');
    localStorage.removeItem('cspj_user');
    setUser(null);
  };

  const adminCreateUser = async (newUserData) => {
    try {
      const response = await api.post('/admin/users', newUserData);
      return response.data;
    } catch (error) {
      // Backend returns BadRequest text or DTO errors
      const errorMessage = typeof error.response?.data === 'string' 
        ? error.response.data 
        : error.response?.data?.message || "Erreur lors de la création du compte.";
      throw new Error(errorMessage);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, adminCreateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);