import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { API } from '../lib/api';
import { useAuth } from '../store/auth';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuth((s) => s.login);
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const e164 = (p) => {
    const d = p.replace(/[^\d]/g, '');
    return d.length === 10 ? `+91${d}` : p.startsWith('+') ? p : `+${d}`;
  };

  const sendOtp = async () => {
    setLoading(true);
    try {
      await API.auth.sendOtp(e164(phone));
      toast.success('OTP sent');
      setStep('otp');
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  };

  const verify = async () => {
    setLoading(true);
    try {
      const data = await API.auth.verifyOtp({ phone: e164(phone), otp });
      await login(data);
      toast.success('Welcome back');
      navigate('/');
    } catch (e) { toast.error(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-bg p-4">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary-light">
            <ShieldCheck className="text-primary" size={28} />
          </div>
          <h1 className="text-2xl font-extrabold">Admin Console</h1>
          <p className="text-sm text-muted">Job India · sign in to continue</p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-4">
            <div>
              <label className="label">Admin phone number</label>
              <input
                className="input" placeholder="98765 43210" value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
              />
            </div>
            <button className="btn-primary w-full" onClick={sendOtp} disabled={loading || phone.length < 10}>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="label">Enter 6-digit OTP sent to {e164(phone)}</label>
              <input
                className="input tracking-[0.5em] text-center text-lg font-bold" placeholder="------"
                maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && verify()}
              />
            </div>
            <button className="btn-primary w-full" onClick={verify} disabled={loading || otp.length !== 6}>
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button className="btn-ghost w-full" onClick={() => setStep('phone')}>Change number</button>
          </div>
        )}
      </div>
    </div>
  );
}
