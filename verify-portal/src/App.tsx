import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Supabase Configuration (Matching the main app)
const SUPABASE_URL = 'https://hkdkhzfdmvcxvopasohm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrZGtoemZkbXZjeHZvcGFzb2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMDU2NzgsImV4cCI6MjA4Njg4MTY3OH0.7It-Dx1QyTyaIFRgsIb46y6IoHOl13RFGaUvXBwkKPI';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const LOGO_URL = "https://i.ibb.co/vC4MYFFk/1770137585956.png";

const VerificationPortal: React.FC = () => {
    const [email, setEmail] = useState('');
    const [step, setStep] = useState<'input' | 'processing' | 'success'>('input');
    const [error, setError] = useState('');

    const handleVerify = async () => {
        if (!email.trim() || !email.includes('@')) {
            return setError('Please enter a valid email address');
        }

        setStep('processing');
        setError('');

        try {
            // Logic: Update the 'students' table to set is_verified = true
            const { data, error: updateError } = await supabase
                .from('students')
                .update({ is_verified: true })
                .eq('email', email.trim())
                .select();

            if (updateError) throw updateError;

            if (!data || data.length === 0) {
                setStep('input');
                return setError('Registration record not found for this email');
            }

            setStep('success');
        } catch (err) {
            setStep('input');
            setError('Verification service temporarily unavailable');
        }
    };

    return (
        <div className="min-h-screen bg-[#fcfaff] flex flex-col items-center justify-center p-6 relative">
            <div className="gradient-blur top-[-100px] left-[-100px]" />
            <div className="gradient-blur bottom-[-100px] right-[-100px]" />

            <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl p-10 md:p-14 border border-slate-50 text-center animate-in zoom-in fade-in duration-700">
                <img src={LOGO_URL} className="w-20 h-20 mx-auto rounded-3xl mb-8 shadow-lg" />

                {step === 'input' && (
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-tight mb-2">Identify Verification</h1>
                            <p className="text-[10px] font-black text-violet-500 uppercase tracking-[0.3em] mb-8">Confirm your email to activate portal</p>
                        </div>

                        <div className="space-y-4 text-left">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Registered Email</p>
                                <input
                                    type="email"
                                    placeholder="Enter your email address"
                                    className="w-full p-5 rounded-3xl bg-slate-50 border border-transparent focus:border-violet-200 outline-none font-bold text-sm transition-all focus:ring-4 focus:ring-violet-50"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-500 text-[10px] font-black uppercase py-4 px-6 rounded-2xl border border-red-100 animate-in shake duration-300">
                                    {error}
                                </div>
                            )}

                            <button
                                onClick={handleVerify}
                                className="w-full py-5 bg-violet-600 text-white rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-violet-200 hover:bg-violet-700 active:scale-95 transition-all mt-4"
                            >
                                Send Verification Fix
                            </button>
                        </div>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="py-12 space-y-8 animate-in fade-in duration-500">
                        <div className="w-24 h-24 border-4 border-slate-100 border-t-violet-600 rounded-full animate-spin mx-auto" />
                        <div className="space-y-2">
                            <h2 className="text-xl font-black text-slate-900 uppercase">Synchronizing...</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Updating Supabase Auth Layers</p>
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="space-y-8 py-4 animate-in zoom-in duration-700">
                        <div className="w-28 h-28 bg-green-500 text-white rounded-full mx-auto flex items-center justify-center shadow-2xl shadow-green-100">
                            <svg className="w-14 h-14 check-animation" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase mb-2">Email Confirmed!</h2>
                            <p className="text-[11px] font-bold text-slate-500 leading-relaxed px-4">
                                Your email bypass has been successfully applied. You can now log into the portal without further confirmation prompts.
                            </p>
                        </div>

                        <button
                            onClick={() => window.location.href = 'https://cbsetoppers.com'}
                            className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all"
                        >
                            Go to Portal
                        </button>
                    </div>
                )}
            </div>

            <p className="mt-10 text-[9px] font-bold text-slate-300 uppercase tracking-[0.5em]">CBSE TOPPERS ⨯ Security Layer 2.0</p>
        </div>
    );
};

export default VerificationPortal;
