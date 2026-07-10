import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

const INITIAL_USERS = [
  { id: 1, username: "aymen", email: "aymen.lahdaoui@cspj.ma", role: "Fonctionnaire", password: "password123" },
  { id: 2, username: "youness", email: "y.bachar@cspj.ma", role: "Fonctionnaire", password: "password123" },
  { id: 3, username: "admin_general", email: "admin@cspj.ma", role: "Admin", password: "adminpassword" },
  { id: 4, username: "asso_magistrats", email: "contact@association-magistrats.ma", role: "Association", password: "assopassword" }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Stockage dynamique des utilisateurs en mémoire (ou localStorage pour persister)
  const [usersDatabase, setUsersDatabase] = useState(() => {
    const savedDb = localStorage.getItem('cspj_users_db');
    return savedDb ? JSON.parse(savedDb) : INITIAL_USERS;
  });

  useEffect(() => {
    localStorage.setItem('cspj_users_db', JSON.stringify(usersDatabase));
  }, [usersDatabase]);

  useEffect(() => {
    const savedUser = localStorage.getItem('cspj_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const foundUser = usersDatabase.find(
          (u) => u.username.toLowerCase() === username.trim().toLowerCase()
        );

        if (!foundUser) {
          reject("Identifiant inconnu. Ce compte n'existe pas.");
          return;
        }

        if (foundUser.password === password) {
          const userSession = {
            id: foundUser.id,
            username: foundUser.username,
            email: foundUser.email,
            role: foundUser.role,
            token: "mock-jwt-token-secure"
          };
          
          localStorage.setItem('cspj_user', JSON.stringify(userSession));
          setUser(userSession);
          resolve(userSession);
        } else {
          reject("Mot de passe incorrect.");
        }
      }, 500);
    });
  };

  // Fonction accessible par l'admin pour créer un compte
  const registerNewUser = (newUserData) => {
    // 🛡️ Sécurité : Bloquer strictement la création de compte Admin
    if (newUserData.role === "Admin") {
      throw new Error("Action non autorisée : Impossible de créer un compte Administrateur.");
    }

    const userExists = usersDatabase.some(u => u.username.toLowerCase() === newUserData.username.toLowerCase());
    if (userExists) {
      throw new Error("Cet identifiant existe déjà.");
    }

    const newUser = {
      id: usersDatabase.length + 1,
      username: newUserData.username.trim(),
      email: newUserData.email.trim() || `${newUserData.username}@cspj.ma`,
      role: newUserData.role,
      password: newUserData.password
    };

    setUsersDatabase(prev => [...prev, newUser]);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('cspj_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, usersDatabase, registerNewUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);