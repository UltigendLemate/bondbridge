import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '../components/auth/AuthLayout';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useApiCall } from '../apis/globalCatchError';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import OTPForm from "../components/auth/OTPForm";
import { ArrowLeft } from "lucide-react";
// Import the API function (you'll need to create this)
import { sendOTPEmail, verifyOTPEmail, forgotPasswordEmail } from "../apis/commonApiCalls/authenticationApi";

// Custom styles for the phone input component that change with theme
// const customPhoneInputStyles = `
//   /* Light Theme Styles */
//   .intl-tel-input .country-list {
//     background-color: var(--background);
//     color: var(--foreground);
//     border-color: var(--border);
//     box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
//   }
  
//   .intl-tel-input .country-list .country {
//     color: var(--foreground);
//   }
  
//   .intl-tel-input .country-list .country.highlight {
//     background-color: var(--muted);
//   }
  
//   .intl-tel-input .country-list .country .dial-code {
//     color: var(--muted-foreground);
//   }
  
//   .intl-tel-input .selected-flag {
//     background-color: transparent;
//   }

//   .intl-tel-input.allow-dropdown .flag-container:hover .selected-flag {
//     background-color: var(--muted);
//   }
  
//   .intl-tel-input.allow-dropdown.separate-dial-code .selected-flag {
//     background-color: var(--muted);
//   }
  
//   .intl-tel-input .selected-dial-code {
//     color: var(--foreground);
//     padding-left: 10px; /* Add padding between flag and country code */
//   }
  
//   .intl-tel-input input {
//     background-color: var(--background);
//     color: var(--foreground);
//     border-color: var(--border);
//   }
  
//   .intl-tel-input input:focus {
//     border-color: var(--ring);
//     box-shadow: 0 0 0 2px var(--ring);
//   }

//   .intl-tel-input .country-list .divider {
//     border-bottom-color: var(--border);
//   }
  
//   /* Fix spacing between flag and dial code */
//   .intl-tel-input.separate-dial-code .selected-flag {
//     padding-right: 6px !important;
//   }
  
//   .intl-tel-input.separate-dial-code .selected-dial-code {
//     margin-left: 6px !important;
//   }
// `;

const ForgotPassword: React.FC = () => {
    const [step, setStep] = useState<'email' | 'otp' | 'newPassword'>('email');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [otpError, setOtpError] = useState('');
    const [receivedOTP, setReceivedOTP] = useState<string>('');
    const navigate = useNavigate();

    // Use our custom hooks for API calls
    const [executeSendOTP, isSendingOTP] = useApiCall(sendOTPEmail);
    const [executeVerifyOTP, isVerifyingOTP] = useApiCall(verifyOTPEmail);
    const [executeForgotPassword, isResettingPassword] = useApiCall(forgotPasswordEmail);

    // Add effect to apply styles to the phone input after it's rendered
    // useEffect(() => {
    //     // Apply custom theme styles
    //     const styleElement = document.createElement('style');
    //     styleElement.textContent = customPhoneInputStyles;
    //     document.head.appendChild(styleElement);

    //     const fixPhoneInputStyles = () => {
    //         const container = document.querySelector('.intl-tel-input');
    //         if (container) {
    //             // Make width consistent
    //             container.setAttribute('style', 'width: 100% !important; height: 40px !important;');

    //             // Fix flag container height
    //             const flagContainer = container.querySelector('.flag-container');
    //             if (flagContainer) {
    //                 flagContainer.setAttribute('style', 'height: 100% !important;');
    //             }

    //             // Fix selected flag height
    //             const selectedFlag = container.querySelector('.selected-flag');
    //             if (selectedFlag) {
    //                 selectedFlag.setAttribute('style', 'height: 100% !important; display: flex !important; align-items: center !important;');
    //             }

    //             // Fix selected dial code (country code) spacing
    //             const selectedDialCode = container.querySelector('.selected-dial-code');
    //             if (selectedDialCode) {
    //                 selectedDialCode.setAttribute('style', 'margin-left: 6px !important; padding-left: 0 !important;');
    //             }

    //             // Fix input height
    //             const input = container.querySelector('input');
    //             if (input) {
    //                 input.setAttribute('style', 'height: 40px !important; background-color: var(--background) !important; color: var(--foreground) !important; border-color: var(--border) !important;');
    //                 input.classList.add('border', 'border-input', 'rounded-md', 'shadow-sm', 'focus:outline-none', 'focus:ring-ring', 'focus:border-ring');
    //             }
    //         }
    //     };

    //     fixPhoneInputStyles();
    //     const timeoutId = setTimeout(fixPhoneInputStyles, 100);

    //     return () => {
    //         clearTimeout(timeoutId);
    //         if (document.head.contains(styleElement)) {
    //            document.head.removeChild(styleElement);
    //         }
    //     };
    // }, [step]);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        // Clear any previous error
        setEmailError('');

        const result = await executeSendOTP({
            email,
            forgot: '1'
        });
        if (result.success && result.data) {
            // For testing purposes - extract OTP from response
            // In a production environment, this would come via email
            // @ts-expect-error - accessing OTP for testing purposes
            const otpValue = result.data.otp || "Check your email for OTP";
            setReceivedOTP(otpValue.toString());
            setStep('otp');
        } else {
            // Show error message for invalid email
            setEmailError(result.message || "Invalid Email");
        }
    };

    const handleVerifyOTP = async (otp: string) => {
        // Clear any previous error
        setOtpError('');

        const result = await executeVerifyOTP({
            email,
            otp,
            forgot: '1'
        });

        if (result.success && result.data) {
            setStep('newPassword');
        } else {
            // Show error message for incorrect OTP
            setOtpError('Please Check your OTP and Try Again');
        }
    };

    const handleSetNewPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        // Clear any previous error
        setPasswordError('');

        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords Don't Match");
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError("Password Should be at least 6 Characters");
            return;
        }

        // Call the forgotPasswordEmail function to reset the password
        const result = await executeForgotPassword({
            email,
            password: newPassword
        });

        if (result.success) {
            // Password reset successful, redirect to login
            navigate('/login');
        } else {
            // Show error message for password reset failure
            setPasswordError("Failed to reset password. Please try again.");
        }
    };

    const handleBackClick = () => {
        if(step === 'email') {
            navigate('/login');
        } else {
            setStep('email');
        }
    };

    const renderForm = () => {
        switch (step) {
            case 'email':
                return (
                    <form onSubmit={handleSendOTP} className="space-y-4">
                        <div>
                            <Label htmlFor="email" className="block text-sm font-medium text-foreground">Email</Label>
                            <div className="mt-1 relative">
                                <Input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="mt-1 block w-full h-10 px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring"
                                    placeholder="Enter your email"
                                    required
                                />
                            </div>
                            {emailError && (
                                <p className="text-foreground text-sm mt-1 font-semibold">{emailError}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full cursor-pointer"
                            disabled={isSendingOTP}
                        >
                            {isSendingOTP ? "Sending OTP..." : "Send OTP"}
                        </Button>
                    </form>
                );
            case 'otp':
                return (
                    <div className="space-y-4">
                        <div className="text-center mb-4">
                            <p className="text-sm text-muted-foreground">
                                We've sent a verification code to your email
                            </p>
                        </div>
                        <OTPForm 
                            onVerify={handleVerifyOTP} 
                            receivedOTP={receivedOTP} 
                            onResendOTP={() => handleSendOTP({
                                preventDefault: () => {},
                            } as React.FormEvent)}
                        />
                        {otpError && (
                            <p className="text-foreground text-sm text-center font-semibold">{otpError}</p>
                        )}
                        <Button
                            onClick={() => setStep('email')}
                            variant="link"
                            className="mt-4 text-foreground hover:underline w-full text-center cursor-pointer"
                        >
                            Back
                        </Button>
                        {isVerifyingOTP && (
                            <p className="text-center text-sm text-muted-foreground">
                                Verifying...
                            </p>
                        )}
                    </div>
                );
            case 'newPassword':
                return (
                    <form onSubmit={handleSetNewPassword} className="space-y-4">
                        <div>
                            <Label htmlFor="newPassword" className="block text-sm font-medium text-foreground">
                                New Password
                            </Label>
                            <div className="relative">
                                <Input
                                    type="password"
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="mt-1 block w-full h-10 pr-7 px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant={"ghost"}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground cursor-pointer"
                                    style={{ top: '4px' }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const passwordInput = document.getElementById('newPassword') as HTMLInputElement;
                                        passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </Button>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
                                Confirm Password
                            </Label>
                            <div className="relative">
                                <Input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="mt-1 block w-full h-10 pr-7 px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant={"ghost"}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground cursor-pointer"
                                    style={{ top: '4px' }}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const passwordInput = document.getElementById('confirmPassword') as HTMLInputElement;
                                        passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
                                    }}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </Button>
                            </div>
                        </div>

                        {passwordError && (
                            <p className="text-foreground text-sm font-semibold">{passwordError}</p>
                        )}

                        <Button
                            type="submit"
                            className="w-full cursor-pointer"
                            disabled={isResettingPassword}
                        >
                            {isResettingPassword ? "Resetting Password..." : "Set New Password"}
                        </Button>
                    </form>
                );
            default:
                return null;
        }
    };

    return (
        <>
            {(step === 'otp' || step === 'newPassword' || step === 'email') && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-20 left-24 z-50 cursor-pointer hidden md:flex items-center justify-center"
                    onClick={handleBackClick}
                >
                    <ArrowLeft className="h-6 w-6" />
                    <span className="sr-only">Back</span>
                </Button>
            )}
            <AuthLayout
                title="Reset Your Password"
                subtitle="Follow the steps to securely reset your password"
                image="/auth/login.png"
                showOTP={step === 'otp'}
                otpMessage="Verify your identity"
                isForgotPassword={true}
            >
                {renderForm()}
                <div className="mt-4 text-center">
                    <Link to="/login" className="text-foreground hover:underline">
                        Back to Login
                    </Link>
                </div>
            </AuthLayout>
        </>
    );
};

export default ForgotPassword;
