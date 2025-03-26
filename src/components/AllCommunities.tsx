import { Community } from "../lib/constants";
import { Loader2 } from "lucide-react";

interface AllCommunitiesProps {
  communities: Community[];
  isLoadingCommunities?: boolean;
}

const AllCommunities: React.FC<AllCommunitiesProps> = ({ communities, isLoadingCommunities }) => {
  if (isLoadingCommunities) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (communities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No communities joined yet
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {communities.map((community) => (
        <div 
          key={community.id}
          className="relative rounded-xl bg-muted cursor-pointer hover:bg-accent transition-colors"
        >
          {/* Cover Image */}
          <div className="h-16 w-full rounded-t-xl overflow-hidden">
            <img 
              src={community.backgroundImage || '/profile/community/commbg.png'} 
              alt="" 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Profile Picture */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
            <div className="w-16 h-16 rounded-full border-4 border-background overflow-hidden">
              <img 
                src={community.pfp || '/profile/default-avatar.png'} 
                alt="" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          {/* Content */}
          <div className="pt-10 pb-4 px-4 text-center">
            <h3 className="text-base font-medium text-foreground">
              {community.name}
            </h3>
            <p className="text-sm text-muted-foreground">
              members: {community.members.toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AllCommunities;