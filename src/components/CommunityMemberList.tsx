import { useState, useEffect } from "react";
import { fetchProfileById } from "@/apis/commonApiCalls/profileApi";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { useApiCall } from "@/apis/globalCatchError";
import { MemberDetail, ExtendedMember } from "@/apis/apiTypes/communitiesTypes";

interface CommunityMemberListProps {
  memberIds?: string[];
  memberDetails?: MemberDetail[];
}

const CommunityMemberList = ({ memberIds, memberDetails }: CommunityMemberListProps) => {
  const [members, setMembers] = useState<ExtendedMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [fetchProfile] = useApiCall(fetchProfileById);

  useEffect(() => {
    // If memberDetails are provided, use them directly
    if (memberDetails && memberDetails.length > 0) {
      // Format members, filtering out members without names
      const formattedMembers = memberDetails
        .filter(member => member.name && member.name.trim() !== "")
        .map(member => ({
          _id: member._id,
          name: member.name,
          profilePic: member.profilePic || "",
          avatar: member.avatar || "",
          nickName: "Member",
        }));
      
      setMembers(formattedMembers);
      setLoading(false);
      return;
    }
    
    // Otherwise fetch using memberIds
    const fetchMembers = async () => {
      if (!memberIds || !memberIds.length) {
        setMembers([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch member profiles in parallel with a limit of 30 at a time
        const memberChunks = memberIds.slice(0, 30); // Limit to 30 for performance
        const memberPromises = memberChunks.map(async (memberId) => {
          const response = await fetchProfile(memberId);
          if (response.success && response.data && response.data.name && response.data.name.trim() !== "") {
            return {
              _id: memberId,
              name: response.data.name,
              profilePic: response.data.profilePic || "",
              avatar: response.data.avatar || "",
              bio: response.data.bio || "",
              email: response.data.email || "",
              interests: response.data.interests || []
            };
          }
          return null;
        });
        
        const memberProfiles = (await Promise.all(memberPromises)).filter(Boolean) as ExtendedMember[];
        setMembers(memberProfiles);
      } catch (err) {
        console.error("Error fetching community members:", err);
        setError("Failed to load Community Members");
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [memberIds, memberDetails, fetchProfile]);

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 p-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-6 text-muted-foreground">{error}</div>;
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No Members Found in this Community
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {members.map((member) => (
        <Link
          key={member._id}
          to={`/profile/${member._id}`}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/30 transition-colors"
        >
          <Avatar className="h-10 w-10 bg-purple-900/40 border-2 border-purple-500/30">
            <AvatarImage src={member.profilePic || member.avatar} alt={member.name} />
            <AvatarFallback className="bg-purple-900/50 text-white">
              {member.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{member.name}</span>
            <span className="text-xs text-muted-foreground">
              {member.nickName || "Member"}
            </span>
          </div>
        </Link>
      ))}
      
      {/* {memberIds && memberIds.length > members.length && (
        <div className="text-center py-2 text-sm text-muted-foreground">
          + {memberIds.length - members.length} More members
        </div>
      )} */}
    </div>
  );
};

export default CommunityMemberList; 