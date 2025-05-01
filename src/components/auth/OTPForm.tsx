import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface OTPFormProps {
  onVerify: (otp: string) => void;
  receivedOTP: string;
  onResendOTP: () => void;
}

const OTPForm: React.FC<OTPFormProps> = ({ onVerify,  onResendOTP }) => {
  const [otp, setOtp] = useState('');
  const [, setShowOTP] = useState(true);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    // Timer for showing OTP - 20 seconds
    const otpTimer = setTimeout(() => {
      setShowOTP(false);
    }, 10000);

    // Timer for enabling resend - 60 seconds (1 minute)
    const resendTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(resendTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(otpTimer);
      clearInterval(resendTimer);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onVerify(otp);
  };

  const handleResendOTP = () => {
    onResendOTP();
    setCanResend(false);
    setCountdown(60);
    setShowOTP(true);
    
    // Reset the resend timer
    const resendTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(resendTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Reset the OTP display timer
    setTimeout(() => {
      setShowOTP(false);
    }, 20000);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="otp" className="block text-sm font-medium text-foreground">OTP</label>
          <input
            type="text"
            id="otp"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-muted-foreground rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <Button
          type="submit"
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
        >
          Verify
        </Button>
      </form>
      
      <div className="mt-4 text-center">
        <Button
          type="button"
          onClick={handleResendOTP}
          variant="link"
          disabled={!canResend}
          className="text-sm text-foreground hover:underline cursor-pointer pb-20"
        >
          {canResend ? "Resend OTP" : `Resend OTP in ${countdown}s`}
        </Button>
      </div>
      
      {/* <div className="flex justify-center absolute left-0 right-0 text-center mt-4" style={{ top: "calc(76%)" }}>
        {showOTP && (
          <p className="text-foreground font-bold border-1 px-4 border-primary rounded-full text-xl w-fit p-2">
            {`OTP : ${receivedOTP}`}
          </p>
        )}
      </div> */}
    </div>
  );
};

export default OTPForm;
