'use client';

import { useState, FormEvent } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export function useLoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, loading, error, clearError } = useAuthContext();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        clearError();
        if (await login(email, password)) {
            router.replace('/');
        }
    };

    return {
        email,
        setEmail,
        password,
        setPassword,
        showPassword,
        setShowPassword,
        loading,
        error,
        handleSubmit,
    };
}