import { useEffect, useState } from "react";

export function useAuth() {
    const [isLoggedin, setIsLoggedin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuth = () => {
        const token = localStorage.getItem("token");
        setIsLoggedin(!!token);
        setIsLoading(false);
    };
    
    useEffect(() => {
        checkAuth();
        window.addEventListener('storage', checkAuth);
        return () => window.removeEventListener('storage', checkAuth);
    }, []);

    return {
        isLoggedin,
        isLoading,
        checkAuth
    };
}