'use client';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useEffect, useState } from 'react';
import MainContent from '../../components/layout/MainContent';

export default function Dashboard() {
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading delay (you can replace this with actual data fetching)
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return <LoadingSpinner fullScreen text="Carregando dashboard..." />;
    }

    return <MainContent />;
}