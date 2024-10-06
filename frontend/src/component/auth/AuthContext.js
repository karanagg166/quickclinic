import React, { createContext, useState, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authState, setAuthState] = useState(() => {
        const savedAuthState = localStorage.getItem('authState');
        return savedAuthState
            ? JSON.parse(savedAuthState)
            : { success: false, user: null };
    });

    const login = async (email, password) => {
        console.log(process.env.REACT_APP_API_URL);
        try {
            const { data } = await axios.post(`/api/v1/login`, { email, password });
            if (data) {
                const newAuthState = {
                    success: true,
                    user: data.user,
                };
                
                // Update local storage and the auth state
                localStorage.setItem('authState', JSON.stringify(newAuthState));
                setAuthState(newAuthState);
                
                // Return the new auth state directly
                console.log("new auth state", newAuthState);
                console.log("auth context.js data is ", data);
                return newAuthState;
            } else {
                return false;
            }
        } catch (error) {
            console.log("hey");
            alert(error.response.data.message);
            return false;
        }
    };
    
    const logout = async () => {
        try {
            await axios.post('/api/v1/logout');
            setAuthState({
                success: false,
                user: null,
            });
            localStorage.removeItem('authState');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ authState, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
