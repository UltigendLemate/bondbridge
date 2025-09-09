import { Checkbox } from "@/components/ui/checkbox";
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import OTPForm from "../components/auth/OTPForm";
// import IntlTelInput from "react-intl-tel-input";
import Captcha, { CaptchaHandle } from "@/components/auth/captcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import "react-intl-tel-input/dist/main.css";
import { toast } from "sonner";
import { sendOTPEmail, verifyOTPEmail } from "../apis/commonApiCalls/authenticationApi";
import { useApiCall } from "../apis/globalCatchError";

const Signup: React.FC = () => {
  const [showOTP, setShowOTP] = useState(false);
  const [email, setEmail] = useState("");
  const [receivedOTP, setReceivedOTP] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [captchaSolved, setCaptchaSolved] = useState(false);
  const captchaRef = useRef<CaptchaHandle | null>(null);
  const honeypotRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle referral code from URL
  useEffect(() => {
    const referralCode = searchParams.get("referral");
    if (referralCode) {
      sessionStorage.setItem("referralCode", referralCode);
    }
  }, [searchParams]);

  // Use our custom hooks for API calls
  const [executeSendOTP, isSendingOTP] = useApiCall(sendOTPEmail);
  const [executeVerifyOTP, isVerifyingOTP] = useApiCall(verifyOTPEmail);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Clear any previous error messages
    setErrorMessage("");

    if (!captchaSolved) {
      setErrorMessage("Please complete the CAPTCHA.");
      return;
    }
    if (honeypotRef.current && honeypotRef.current.value.trim().length > 0) {
      setErrorMessage("Invalid request.");
      return;
    }

    const result = await executeSendOTP({
      email,
    });

    if (result.status === 409) {
      setErrorMessage("User with this Email Already Exists");
      captchaRef.current?.reset();
      setCaptchaSolved(false);
      return;
    } else if (!result.success) {
      setErrorMessage(result.message || "Invalid Email");
      captchaRef.current?.reset();
      setCaptchaSolved(false);
      return;
    }

    if (result.success && result.data) {
      // For testing purposes - extract OTP from response
      // In a production environment, this would come via email
      // @ts-expect-error - accessing OTP for testing purposes
      const otpValue = result.data.otp || "Check your email for OTP";
      setReceivedOTP(otpValue.toString());
      setShowOTP(true);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    const result = await executeVerifyOTP({
      email,
      otp,
    });

    if (result.success && result.data) {
      // commenting because link will change to /home so it will call the api automatically there
      // const userData = await fetchUserProfile(result.data?.userDetails._id, result.data?.userDetails._id);
      // if (userData.success) {
      //   dispatch(updateCurrentUser(userData.data));
      // }
      navigate("/setup-profile");
    } else {
      toast.error("Invalid OTP");
    }
  };

  return (
    <>
      {showOTP && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-20 left-24 z-50 cursor-pointer"
          onClick={() => setShowOTP(false)}
        >
          <ArrowLeft className="h-6 w-6" />
          <span className="sr-only">Back</span>
        </Button>
      )}
      <AuthLayout
        title={
          <div className="text-nowrap">
            Making Connections,
            <br />
            Growing Friendships
          </div>
        }
        subtitle={
          <>
            Sign up for your <span className="grad font-bold">BondBridge</span>{" "}
            journey today!
          </>
        }
        videoLight="/auth/signup_lightmode.mp4"
        videoDark="/auth/signup_darkmode.mp4"
        showOTP={showOTP}
        otpMessage="Welcome, We are glad to see you!"
      >
        {!showOTP ? (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 w-full flex flex-col items-center relative"
          >
            <div className="w-full flex flex-col justify-start">
              <Label
                htmlFor="email"
                className="block text-sm font-medium text-foreground"
              >
                Email
              </Label>
              <div className="relative">
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full h-10 px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-ring focus:border-ring"
                  placeholder="Enter your email"
                  required
                />
                {errorMessage && (
                  <p className="text-foreground text-sm mt-1 font-semibold">
                    {errorMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="w-full flex flex-col justify-start">
              <label className="block text-sm font-medium text-foreground">
                Verification
              </label>
              <Captcha
                ref={captchaRef}
                onSolve={setCaptchaSolved}
                minSolveMs={1500}
              />
              <input
                ref={honeypotRef}
                name="company"
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div className="space-y-2 flex flex-col justify-start w-full">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  required
                  className="cursor-pointer text-foreground"
                />
                <label htmlFor="terms" className="text-xs text-foreground">
                  I agree to{" "}
                  <Link
                    to="/terms"
                    className="text-foreground font-bold underline"
                  >
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy"
                    className="text-foreground font-bold underline"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newsletter"
                  className="cursor-pointer text-foreground"
                />
                <label htmlFor="newsletter" className="text-xs text-foreground">
                  I would like to receive updates about products, services, and
                  promotions
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary cursor-pointer"
              disabled={isSendingOTP || !captchaSolved}
            >
              {isSendingOTP
                ? "Sending OTP..."
                : !captchaSolved
                ? "Verify CAPTCHA"
                : "Sign Up"}
            </button>

            <div className="flex flex-col items-center justify-center gap-1">
              <div className="flex justify-center pt-4">
                {/* <p className="text-md text-center text-muted-foreground">Get the app:</p> */}
                <div className="flex justify-center gap-4">
                  <Link
                    to="https://apps.apple.com/in/app/bondbridge-ai/id6745119162"
                    className=""
                  >
                    <img
                      src="/assets/stores/appstore.svg"
                      alt="Download on App Store"
                      className="w-40"
                    />
                  </Link>
                  <Link
                    to="https://play.google.com/store/apps/details?id=com.bondbridge.bondbridgeonline"
                    className=""
                  >
                    <img
                      src="/assets/stores/googleplay.svg"
                      alt="Get it on Google Play"
                      className="w-40"
                    />
                  </Link>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                We've sent a verification code to your email
              </p>
            </div>
            <OTPForm
              onVerify={handleVerifyOTP}
              receivedOTP={receivedOTP}
              onResendOTP={() =>
                handleSubmit({
                  preventDefault: () => {},
                } as React.FormEvent)
              }
            />
            {isVerifyingOTP && (
              <p className="text-center text-sm text-muted-foreground">
                Verifying...
              </p>
            )}
          </div>
        )}
      </AuthLayout>
    </>
  );
};

export default Signup;
