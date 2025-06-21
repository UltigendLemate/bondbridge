import React, { useEffect, useState } from 'react';
import { addCommunity, removeCommunity, setCommunities } from '../../store/createProfileSlice';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchCommunities } from '../../apis/commonApiCalls/communitiesApi';
import { useApiCall } from '../../apis/globalCatchError';
import { Community } from '@/lib/constants';
import { CommunityResponse } from '@/apis/apiTypes/communitiesTypes';
import { Loader2 } from "lucide-react";

const SelectCommunitiesTab: React.FC = () => {
  const dispatch = useAppDispatch();
  const [executeFetchCommunities, isLoading] = useApiCall(fetchCommunities);
  
  // Get all profile data from Redux store
  const { communitiesSelected } = useAppSelector(state => state.createProfile);
  const [communities, setCommunityList] = useState<CommunityResponse[]>([]);

  // Function to convert CommunityResponse to Community format for Redux store
  const mapToCommunity = (communityResponse: CommunityResponse): Community => ({
    id: communityResponse._id,
    name: communityResponse.name,
    members: communityResponse.memberCount || 0,
    pfp: communityResponse.profilePicture || '',
    description: communityResponse.description || '',
    backgroundImage: communityResponse.backgroundImage || '',
    bio: communityResponse.bio || ''
  });

  useEffect(() => {
    const loadCommunities = async () => {
      const { data, success } = await executeFetchCommunities();
      if (success && data) {
        setCommunityList(data);
        
        // Map the API communities to the format expected by the Redux store
        const formattedCommunities = data.map(mapToCommunity);
        dispatch(setCommunities(formattedCommunities));
      }
    };
    
    loadCommunities();
  },[]);

  const isCommunitySelected = (id: string) => {
    return communitiesSelected.some(community => community.id === id);
  };

  // Toggle community selection - only updates Redux store, no API calls
  const toggleCommunity = (community: CommunityResponse) => {
    const communityData = mapToCommunity(community);
    const isSelected = isCommunitySelected(community._id);
    
    // Update Redux store only
    if (isSelected) {
      // If already selected, remove it from selected list
      dispatch(removeCommunity(communityData));
    } else {
      // If not selected, add it to selected list
      dispatch(addCommunity(communityData));
    }
  };
  
  useEffect(() => {
    console.log("Selected Communities:", communitiesSelected);
  }, [communitiesSelected]);

  // Loading skeleton UI
  if (isLoading) {
    return (
      <div className="h-[45vh]">
        <h1 className="text-3xl font-medium mb-1 text-foreground">Let's Join Exciting Communities</h1>
        <p className="text-muted-foreground mb-8">Select Communities</p>
        
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <h1 className="text-3xl font-medium mb-1 text-foreground">Let's Join Exciting Communities</h1>
      <p className="text-muted-foreground mb-8">Select Communities</p>
      
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 md:gap-4 gap-6 max-h-[45vh] overflow-y-auto">
        {communities.map((community) => (
          <div 
            key={community._id}
            className={`relative rounded-xl cursor-pointer transition-all ${
              isCommunitySelected(community._id) 
                ? 'bg-accent' 
                : 'bg-muted'
            }`}
            onClick={() => toggleCommunity(community)}
          >
            {/* Selection Indicator */}
            {isCommunitySelected(community._id) && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            )}

            {/* Cover Image */}
            <div className="h-16 w-full rounded-t-xl overflow-hidden fill-accent">
              <img 
                src={community.backgroundImage || '/profile/community/commbg.png'} 
                alt="" 
                className="w-full h-full object-cover"
              />
            </div>

            {/* Profile Picture */}
            <div className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-16 h-16 rounded-full border-4 border-background overflow-hidden">
                <img 
                  src={community.profilePicture || '/profile/default-avatar.png'} 
                  alt="" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Content */}
            <div className="pt-8 pb-2 px-4 text-center">
              <h3 className="text-base font-medium text-foreground">
                {community.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Members: {community.memberCount || 0}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Display selected count */}
      {communitiesSelected.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-foreground font-medium">
            You've selected {communitiesSelected.length} {communitiesSelected.length === 1 ? 'community' : 'communities'}
          </p>
        </div>
      )}
    </div>
  );
};

export default SelectCommunitiesTab;