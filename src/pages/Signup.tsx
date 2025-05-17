import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../components/auth/AuthLayout";
import OTPForm from "../components/auth/OTPForm";
import { Checkbox } from "@/components/ui/checkbox";
// import IntlTelInput from "react-intl-tel-input";
import "react-intl-tel-input/dist/main.css";
import { sendOTP, verifyOTP } from "../apis/commonApiCalls/authenticationApi";
import { useApiCall } from "../apis/globalCatchError";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { CustomPhoneInput } from "@/components/ui/custom-phone-input";


const Signup: React.FC = () => {
  const [showOTP, setShowOTP] = useState(false);
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("1"); // Default to USA (+1)
  const [, setIsValidPhone] = useState(false);
  const [receivedOTP, setReceivedOTP] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Handle referral code from URL
  useEffect(() => {
    const referralCode = searchParams.get('referral');
    if (referralCode) {
      sessionStorage.setItem('referralCode', referralCode);
    }
  }, [searchParams]);

  // Use our custom hooks for API calls
  const [executeSendOTP, isSendingOTP] = useApiCall(sendOTP);
  const [executeVerifyOTP, isVerifyingOTP] = useApiCall(verifyOTP);




  interface CountryData {
    dialCode?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }

  const handlePhoneChange = (
    isValid: boolean,
    value: string,
    selectedCountryData: CountryData
  ) => {
    setIsValidPhone(isValid);
    if (selectedCountryData && selectedCountryData.dialCode) {
      setCountryCode(selectedCountryData.dialCode);
    }

    // Remove the country code from the phone number
    if (selectedCountryData && selectedCountryData.dialCode) {
      const dialCode = selectedCountryData.dialCode;
      let cleanNumber = value.replace(/\D/g, "");

      // If number starts with the dial code, remove it
      const dialCodeString = String(dialCode);
      if (cleanNumber.startsWith(dialCodeString)) {
        cleanNumber = cleanNumber.substring(dialCodeString.length);
      }

      setPhone(cleanNumber);
    } else {
      setPhone(value.replace(/\D/g, ""));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Clear any previous error messages
    setErrorMessage("");

    const validCountryCode = "+" + countryCode;

    const result = await executeSendOTP({
      phoneNumber: phone,
      countryCode: validCountryCode,
    });

    if (result.status === 409) {
      setErrorMessage("User with this Phone Number Already Exists");
      return;
    } else if (!result.success) {
      setErrorMessage(result.message || "Invalid Phone Number");
      return;
    }

    if (result.success && result.data) {
      // For testing purposes - extract OTP from response
      // In a production environment, this would come via SMS
      // @ts-expect-error - accessing OTP for testing purposes
      const otpValue = result.data.otp || "Check your phone for OTP";
      setReceivedOTP(otpValue.toString());
      setShowOTP(true);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    const validCountryCode = "+" + countryCode;

    const result = await executeVerifyOTP({
      phoneNumber: phone,
      otp,
      countryCode: validCountryCode,
    });

    if (result.success && result.data) {
      // commenting because link will change to /home so it will call the api automatically there
      // const userData = await fetchUserProfile(result.data?.userDetails._id, result.data?.userDetails._id);
      // if (userData.success) {
      //   dispatch(updateCurrentUser(userData.data));
      // }
      navigate("/setup-profile");
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
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-foreground"
              >
                Phone
              </label>
              <div className="relative">
                {/* <IntlTelInput
                  ref={phoneInputRef}
                  containerClassName="intl-tel-input"
                  inputClassName="form-control w-full h-10 px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  defaultCountry={"us"}
                  preferredCountries={["us"]}
                  onPhoneNumberChange={handlePhoneChange}
                  onPhoneNumberBlur={handlePhoneChange}
                  format={true}
                  formatOnInit={true}
                  autoPlaceholder={true}
                  nationalMode={false}
                  separateDialCode={true}
                  telInputProps={{
                    className: "w-full",
                    placeholder: "Enter phone number",
                  }}
                /> */}
                <CustomPhoneInput
                  value={phone}
                  onChange={handlePhoneChange}
                  defaultCountryCode={countryCode}
                  placeholder="Enter phone number"
                />
                {errorMessage && (
                  <p className="text-foreground text-sm mt-1 font-semibold">
                    {errorMessage}
                  </p>
                )}
              </div>
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
              disabled={isSendingOTP}
            >
              {isSendingOTP ? "Sending OTP..." : "Sign Up"}
            </button>

            <div className="flex flex-col items-center justify-center gap-1">
              <div className="flex justify-center pt-4">
                {/* <p className="text-md text-center text-muted-foreground">Get the app:</p> */}
                <div className="flex justify-center gap-4">
                  <Link to="#" className="">
                    <img
                      src="/assets/stores/appstore.svg"
                      alt="Download on App Store"
                      className="w-40"
                    />
                  </Link>
                  <Link to="#" className="">
                    <img
                      src="/assets/stores/googleplay.svg"
                      alt="Get it on Google Play"
                      className="w-40"
                    />
                  </Link>
                </div>
              </div>
              <div className="text-4xl font-bold relative text-foreground -top-10 animate-pulse">
                Coming Soon
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                We've sent a verification code to your phone
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
            <button
              onClick={() => setShowOTP(false)}
              className="mt-4 text-foreground hover:underline w-full text-center cursor-pointer"
            >
              Back
            </button>
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
