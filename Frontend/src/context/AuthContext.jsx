import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

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

      // The backend returns a flat object: { token, email, nom, prenom, role }
      const { token, email: userEmail, nom, prenom, role } = response.data;
      
      const userProfile = {
        email: userEmail,
        nom,
        prenom,
        role
      };

      localStorage.setItem('cspj_token', token);
      localStorage.setItem('cspj_user', JSON.stringify(userProfile));
      
      setUser(userProfile);
      return userProfile;

    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 400)) {
        throw new Error("Identifiant ou mot de passe incorrect.");
      }
      throw new Error(error.response?.data?.message || "Erreur de connexion au serveur.");
    }
  };

  const logout = () => {
    localStorage.removeItem('cspj_token');
    localStorage.removeItem('cspj_user');
    setUser(null);
  };

  const registerNewUser = async (newUserData) => {
    try {
      const response = await api.post('/auth/register', newUserData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || "Erreur lors de la création du compte.");
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, registerNewUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);