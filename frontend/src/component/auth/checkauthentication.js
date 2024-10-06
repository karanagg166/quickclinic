import { useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext'; // Adjust the path to where your AuthContext is defined

const useCheckAuthStatus = () => {
    const { setAuthState } = useAuth(); // Make sure setAuthState is provided by AuthContext

    useEffect(() => {
        const checkAuthStatus = async () => {
            try {
                axios.defaults.withCredentials = true; // Ensure cookies are sent with the request
                const { data } = await axios.get('/api/v1/check');
                
                if (data.success) {
                    setAuthState({
                        isAuthenticated: true,
                        user: data.user,
                    });
                } else {
                    setAuthState({
                        isAuthenticated: false,
                        user: null,
                    });
                }
            } catch (error) {
                console.error('Failed to check authentication status:', error);
                setAuthState({
                    isAuthenticated: false,
                    user: null,
                });
            }
        };

        checkAuthStatus();
    }, [setAuthState]); // Ensure the effect runs when `setAuthState` changes
};

export default useCheckAuthStatus;
//hi   helo cacacabjbjbcchacac