import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PersonalInfoTab from "@/components/profile/PersonalInfoTab";
import SkillsInterestsTab from "@/components/profile/SkillsInterestsTab";
import SelectAvatarTab from "@/components/profile/SelectAvatarTab";
import CoverProfilePhotosTab from "@/components/profile/CoverProfilePhotosTab";
import SelectCommunitiesTab from "@/components/profile/SelectCommunitiesTab";
import TabPageLayout from "@/components/layouts/TabPageLayout";
import { useAppDispatch, useAppSelector } from "../store";
import { submitProfile } from "../apis/commonApiCalls/createProfileApi";
import { setPassword } from "../apis/commonApiCalls/authenticationApi";
import { joinMultipleCommunities } from "../apis/commonApiCalls/communitiesApi";
import { useApiCall } from "../apis/globalCatchError";
import { toast } from "sonner";
import { updateCurrentUser } from "@/store/currentUserSlice";

const tabs = [
  { id: "personal", label: "Personal Information" },
  { id: "skills", label: "Skills/Interests" },
  { id: "avatar", label: "Select Avatar" },
  { id: "photos", label: "Cover & Profile Photos" },
  { id: "communities", label: "Select Communities" },
];

// Tabs that require validation
const VALIDATED_TABS = ["personal", "skills"];

const SetupProfile: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const currentTab = location.hash.replace("#", "") || "personal";
  const navigate = useNavigate();
  
  // Validation state for different tabs
  const [personalInfoValid, setPersonalInfoValid] = useState(false);
  const [skillsInterestsValid, setSkillsInterestsValid] = useState(false);
  
  // Track validated tabs
  const [validatedTabs, setValidatedTabs] = useState<string[]>([]);
  
  // Update validated tabs when validation status changes
  useEffect(() => {
    const newValidatedTabs = [...validatedTabs];
    
    // Handle "personal" tab validation
    if (personalInfoValid) {
      if (!newValidatedTabs.includes("personal")) {
        newValidatedTabs.push("personal");
      }
    } else {
      const personalIndex = newValidatedTabs.indexOf("personal");
      if (personalIndex !== -1) {
        newValidatedTabs.splice(personalIndex, 1);
      }
    }
    
    // Handle "skills" tab validation
    if (skillsInterestsValid) {
      if (!newValidatedTabs.includes("skills")) {
        newValidatedTabs.push("skills");
      }
    } else {
      const skillsIndex = newValidatedTabs.indexOf("skills");
      if (skillsIndex !== -1) {
        newValidatedTabs.splice(skillsIndex, 1);
      }
    }
    
    setValidatedTabs(newValidatedTabs);
  }, [personalInfoValid, skillsInterestsValid]);

  // Get profile data from Redux store
  const {
    name,
    phoneNumber,
    countryCode,
    dateOfBirth,
    password,
    skillSelected,
    avatar,
    image,
    communitiesSelected,
    referralCode
  } = useAppSelector(state => state.createProfile);

  // Use our custom hooks for API calls
  const [executeSubmit] = useApiCall(submitProfile);
  const [executeSetPassword] = useApiCall(setPassword);
  const [executeJoinCommunities] = useApiCall(joinMultipleCommunities);

  // Handle form submission
  const handleSubmit = async () => {
    // Validate personal information
    if (!name || !phoneNumber || !dateOfBirth || !password) {
      toast.error("Personal information has not been filled correctly.");
      navigate("#personal"); // Navigate to the personal info tab
      return;
    }
    
    //delete referral code from session storage
    sessionStorage.removeItem('referralCode');

    // First submit the profile
    const result = await executeSubmit({
      name,
      phoneNumber,
      countryCode: countryCode,
      dateOfBirth,
      password,
      skillSelected,
      referralCode: referralCode || "",
      image: image || undefined,
      avatar: avatar || undefined,
      generateToken: "1",
    });
    
    if (result.success && result.data) {
      
      // Now set the password
      const passwordResult = await executeSetPassword({
        password
      });
      
      if (passwordResult.success) {
        // Join selected communities if any are selected
        if (communitiesSelected.length > 0) {
          // Extract community IDs from the selected communities
          const communityIds = communitiesSelected.map(community => community.id);
          
          const joinResult = await executeJoinCommunities(communityIds);
          
          if (joinResult.success) {
            console.log("Successfully joined communities");
          } else {
            console.error("Failed to join some communities");
          }
        }

        dispatch(updateCurrentUser({
          userId: result.data.userDetails._id,
          username: result.data.userDetails.name,
          nickname: result.data.userDetails.nickName,
          email: result.data.userDetails.email,
          avatar: result.data.userDetails.avatar,
          profilePic: result.data.userDetails.profilePic,
          bio: result.data.userDetails.bio,
          interests: result.data.userDetails.interests,
        }));
        
        // Navigate to home page regardless of community join status
        navigate('/');
      }
    }
  };

  const handleNext = () => {
    const currentIndex = tabs.findIndex((tab) => tab.id === currentTab);
    
    // If on the last tab (communities), submit the form instead of navigating
    if (currentIndex === tabs.length - 1) {
      handleSubmit();
      return;
    }
    
    const nextTabIndex = currentIndex + 1;
    const nextTabId = tabs[nextTabIndex].id;
    
    // Only validate for tabs that require validation
    if (VALIDATED_TABS.includes(currentTab)) {
      // Current tab requires validation - check if it's validated
      if (!validatedTabs.includes(currentTab)) {
        toast.error("Please complete all required fields in this tab before proceeding.");
        return;
      }
      
      // If next tab is "skills" and "personal" is not validated, don't allow navigation
      if (nextTabId === "skills" && !validatedTabs.includes("personal")) {
        toast.error("Please complete the Personal Information tab first.");
        navigate("#personal");
        return;
      }
    } 
    // Otherwise, allow navigation to the next tab
    navigate(`#${nextTabId}`);
  };

  const handleBack = () => {
    const currentIndex = tabs.findIndex((tab) => tab.id === currentTab);
    if (currentIndex > 0) {
      navigate(`#${tabs[currentIndex - 1].id}`);
    } else {
      navigate(-1);
    }
  };
  
  // Custom function to check if a tab is accessible
  const isTabAccessible = (tabId: string) => {
    // Current tab is always accessible
    if (tabId === currentTab) return true;
    
    // Get tab indices
    const currentIndex = tabs.findIndex((tab) => tab.id === currentTab);
    const targetIndex = tabs.findIndex((tab) => tab.id === tabId);
    
    // Previous tabs are always accessible
    if (targetIndex < currentIndex) return true;
    
    // Only validate the specific tabs we care about
    if (tabId === "skills") {
      // Skills tab requires Personal Info tab to be validated
      return validatedTabs.includes("personal");
    }
    
    // For all other tabs, only require completion of the validated tabs
    if (tabId === "avatar" || tabId === "photos" || tabId === "communities") {
      return validatedTabs.includes("personal") && validatedTabs.includes("skills");
    }
    
    return true;
  };
  
  const handleTabChange = (tabId: string) => {
    navigate(`#${tabId}`);
  };

  // Check if we're on the last tab
  const isLastTab = currentTab === tabs[tabs.length - 1].id;
  
  // Determine if the Next button should be disabled based on the current tab
  const isNextDisabled = 
    (currentTab === "personal" && !personalInfoValid) || 
    (currentTab === "skills" && !skillsInterestsValid);

  return (
    <div className="max-h-screen overflow-auto">
      <TabPageLayout
        title="Complete Your Profile"
        tabs={tabs}
        currentTab={currentTab}
        onNext={isLastTab ? handleSubmit : handleNext}
        onBack={handleBack}
        isNextDisabled={isNextDisabled}
        validatedTabs={validatedTabs}
        onTabChange={handleTabChange}
        customIsTabAccessible={isTabAccessible}
        decorativeImages={{
          clipboard: "/profile/clipboard.png",
          deco1: "/profile/deco1.png",
          deco2: "/profile/deco2.png",
        }}
      >
        {/* Render tab content */}
        {currentTab === "personal" && <PersonalInfoTab onValidationChange={setPersonalInfoValid} />}
        {currentTab === "skills" && <SkillsInterestsTab onValidationChange={setSkillsInterestsValid} />}
        {currentTab === "avatar" && <SelectAvatarTab />}
        {currentTab === "photos" && <CoverProfilePhotosTab />}
        {currentTab === "communities" && <SelectCommunitiesTab />}
      </TabPageLayout>
    </div>
  );
};

export default SetupProfile;
