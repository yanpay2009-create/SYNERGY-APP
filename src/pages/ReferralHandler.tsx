import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import { safeSetItem } from '../utils/storageUtils';

export const ReferralHandler: React.FC = () => {
    const { code, id } = useParams<{ code: string; id?: string }>();
    const navigate = useNavigate();

    useEffect(() => {
        if (code) {
            safeSetItem('synergy_referrer_code', code.toUpperCase());
        }
        
        if (id) {
            // Redirect to specific campaign
            navigate(`/campaigns?id=${id}`, { replace: true });
        } else {
            // Redirect to home or onboarding
            navigate('/home', { replace: true });
        }
    }, [code, id, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-synergy-blue animate-spin mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">Linking referral code...</p>
            </div>
        </div>
    );
};
