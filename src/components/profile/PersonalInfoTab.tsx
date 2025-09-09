import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { 
  setName, 
  setPhoneNumber,
  setCountryCode, 
  setDateOfBirth,
  setPassword, 
  setReferralCode
} from "../../store/createProfileSlice";
import { RootState } from "../../store";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { CustomPhoneInput } from "../ui/custom-phone-input";

interface PersonalInfoTabProps {
  onValidationChange?: (isValid: boolean) => void;
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({ onValidationChange }) => {
  const dispatch = useDispatch();
  const { name, phoneNumber, countryCode, dateOfBirth, password, referralCode } = useSelector(
    (state: RootState) => state.createProfile
  );
  const [showPassword, setShowPassword] = useState(false);
  const [ageError, setAgeError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Check for referral code in sessionStorage on component mount
  useEffect(() => {
    const storedReferralCode = sessionStorage.getItem('referralCode');
    if (storedReferralCode) {
      dispatch(setReferralCode(storedReferralCode));
    }
  }, [dispatch]);

  const isAtLeast18YearsOld = (dateString: string): boolean => {
    const birthDate = new Date(dateString);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1 >= 18;
    }
    return age >= 18;
  };

  // Handle phone number change
  const handlePhoneChange = (
    _isValid: boolean,
    value: string,
    selectedCountryData: { dialCode?: string }
  ) => {
    if (selectedCountryData && selectedCountryData.dialCode) {
      dispatch(setCountryCode(selectedCountryData.dialCode));
    }
    // value is already the national number, so no need to strip dial code here
    dispatch(setPhoneNumber(value.replace(/\D/g, '')));
  };

  // Validate all required fields
  useEffect(() => {
    const isNameValid = name.trim().length > 0;
    const isPhoneValid = phoneNumber.trim().length > 0;
    const isDateOfBirthValid = dateOfBirth.trim().length > 0;
    const isPasswordValid = password.trim().length >= 6;
    
    // Check age validation
    if (dateOfBirth) {
      if (!isAtLeast18YearsOld(dateOfBirth)) {
        setAgeError("You must be at least 18 years old");
      } else {
        setAgeError(null);
      }
    }
    
    // Check password validation
    if (password.trim()) {
      if (password.trim().length < 6) {
        setPasswordError("Password must be at least 6 characters");
      } else {
        setPasswordError(null);
      }
    } else {
      setPasswordError(null);
    }
    
    const allValid = isNameValid && isPhoneValid && isDateOfBirthValid && isPasswordValid && !ageError;
    
    // Notify parent component of validation status
    if (onValidationChange) {
      onValidationChange(allValid);
    }
  }, [name, phoneNumber, dateOfBirth, password, onValidationChange, ageError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    
    switch (id) {
      case "name": {
        const capitalizedName = value.charAt(0).toUpperCase() + value.slice(1);
        dispatch(setName(capitalizedName));
        break;
      }
      case "dob":
        dispatch(setDateOfBirth(value));
        break;
      case "password":
        dispatch(setPassword(value));
        break;
      case "referralCode":
        dispatch(setReferralCode(value));
        break;
    }
  };

  const togglePasswordVisibility = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPassword(!showPassword);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="name">
          Name<span className="text-destructive -ml-1">*</span>
        </Label>
        <Input
          type="text"
          id="name"
          value={name}
          onChange={handleChange}
        />
      </div>
      
      <div>
        <Label htmlFor="phoneNumber">
          Phone<span className="text-destructive -ml-1">*</span>
        </Label>
        <div className="mt-1 relative" style={{ height: 'auto' }}>
          <CustomPhoneInput 
            value={phoneNumber}
            onChange={handlePhoneChange}
            defaultCountryCode={countryCode}
            placeholder="Enter phone number"
          />
        </div>
      </div>
      

      
      <div>
        <Label htmlFor="password">
          Password<span className="text-destructive -ml-1">*</span>
        </Label>
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            id="password"
            value={password}
            onChange={handleChange}
            className="pr-7"
          />
          <Button
            type="button"
            variant="ghost"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground cursor-pointer"
            onClick={togglePasswordVisibility}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
          </Button>
        </div>
        {passwordError && (
          <div className="mt-2 text-foreground text-sm">{passwordError}</div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 md:gap-4 gap-6">

        <div>
          <Label htmlFor="dob">
            Date Of Birth<span className="text-destructive -ml-1">*</span>
          </Label>
          <Input
            type="date"
            id="dob"
            value={dateOfBirth}
            onChange={handleChange}
            className="date-input text-foreground"
          />
          {ageError && (
            <div className="mt-2 text-foreground text-sm">{ageError}</div>
          )}
        </div>

        <div>
          <div className="">
            <Label htmlFor="referralCode" className="flex items-center space-x-1">
              Referral Code <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enter the code if someone referred you.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            </Label>
            
          </div>
          <Input
            type="text"
            id="referralCode"
            value={referralCode}
            maxLength={6}
            onChange={handleChange}
            readOnly={!!sessionStorage.getItem('referralCode')}
            className={sessionStorage.getItem('referralCode') ? 'bg-muted cursor-not-allowed' : ''}
          />
        </div>

      </div>
    </div>
  );
};

export default PersonalInfoTab;
