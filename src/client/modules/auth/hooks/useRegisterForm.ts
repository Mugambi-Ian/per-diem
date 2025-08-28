'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useRouter } from 'next/navigation';

export function useRegisterForm() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const { register, loading, error, clearError } = useAuthContext();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        clearError();

        if (formData.password !== formData.confirmPassword) {
            return;
        }

        if (!acceptTerms) {
            return;
        }

        if (await register(formData.email, formData.password, formData.fullName)) {
            router.replace('/');
        }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return {
        formData,
        handleChange,
        showPassword,
        setShowPassword,
        showConfirmPassword,
        setShowConfirmPassword,
        acceptTerms,
        setAcceptTerms,
        loading,
        error,
        handleSubmit,
    };
}