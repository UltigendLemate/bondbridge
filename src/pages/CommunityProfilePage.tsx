import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, MessageSquare } from "lucide-react";
import { useApiCall } from "@/apis/globalCatchError";
import {
  joinCommunity,
  fetchCommunityById,
  fetchCommunityPosts,
} from "@/apis/commonApiCalls/communitiesApi";
import { CommunityResponse, TransformedCommunityPost } from "@/apis/apiTypes/communitiesTypes";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import CommunityMemberList from "@/components/CommunityMemberList";
import CommunityPosts from "@/components/CommunityPosts";
import CommunityQuotes from "@/components/CommunityQuotes";
// import { TruncatedList } from "@/components/ui/TruncatedList";
import { TruncatedText } from "@/components/ui/TruncatedText";

const CommunityProfilePage = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<CommunityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [communityPosts, setCommunityPosts] = useState<TransformedCommunityPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isUserMember, setIsUserMember] = useState(false);
  const [isMembershipLoading, setIsMembershipLoading] = useState(false);
  const [executeJoinCommunity] = useApiCall(joinCommunity);
  const [executeFetchCommunityById] = useApiCall(fetchCommunityById);
  const [executeFetchCommunityPosts] = useApiCall(fetchCommunityPosts);

  // Fetch community details
  useEffect(() => {
    const loadCommunity = async () => {
      if (!communityId) return;

      setLoading(true);
      const result = await executeFetchCommunityById(communityId);

      if (result.success && result.data) {
        const communityData = result.data;
        setCommunity(communityData);

        // Check if current user is a member
        const userId = localStorage.getItem("userId");
        if (userId && communityData.members) {
          setIsUserMember(communityData.members.includes(userId));
        }
      } else {
        setError("Failed to load Community Data");
      }
      setLoading(false);
    };

    loadCommunity();
  }, [communityId]);

  // Fetch community posts
  useEffect(() => {
    const loadCommunityPosts = async () => {
      if (!communityId) return;

      setIsLoadingPosts(true);
      const result = await executeFetchCommunityPosts(communityId);

      if (result.success && result.data) {
        setCommunityPosts(result.data);
      } else {
        console.error("Failed to load community posts");
      }
      setIsLoadingPosts(false);
    };

    loadCommunityPosts();
  }, [communityId]);

  const handleJoinCommunity = async () => {
    if (!communityId) return;

    const userId = localStorage.getItem("userId");
    if (!userId) {
      toast.error("Authentication required", {
        description: "Please login to join communities",
      });
      return;
    }

    setIsMembershipLoading(true);
    const result = await executeJoinCommunity({
      communityIds: [communityId],
      userId,
      action: "join",
    });

    if (result.success) {
      setIsUserMember(true);
      toast.success("Success", {
        description: "You have Joined the Community!",
      });
    } else {
      toast.error("Error", {
        description: "Failed to Join Community",
      });
    }
    setIsMembershipLoading(false);
  };

  const handleLeaveCommunity = async () => {
    if (!communityId) return;

    const userId = localStorage.getItem("userId");
    if (!userId) return;

    setIsMembershipLoading(true);
    const result = await executeJoinCommunity({
      communityIds: [communityId],
      userId,
      action: "remove",
    });

    if (result.success) {
      setIsUserMember(false);
      toast.success("Success", {
        description: "You have Left the Community",
      });
    } else {
      toast.error("Error", {
        description: "Failed to Leave Community",
      });
    }
    setIsMembershipLoading(false);
  };

  // Filter posts for the Quotes tab (text-only posts)
  const quotePosts = communityPosts.filter(post =>
    (!post.media || post.media.length === 0)
  );

  // Filter posts for the Posts tab (posts with media)
  const mediaPosts = communityPosts.filter(post =>
    post.media && post.media.length > 0
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p className="text-muted-foreground">
          {error || "Community not found"}
        </p>
        <Button
          variant="outline"
          className="mt-4 cursor-pointer"
          onClick={() => navigate("/activity")}
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header with background image */}
      <div className="relative">
        <div className="h-48 w-full overflow-hidden">
          <img
            src={community.backgroundImage || "/placeholder-bg.jpg"}
            alt={`${community.name} background`}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Back button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 bg-background/60 backdrop-blur-sm rounded-full cursor-pointer"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {/* Community avatar */}
        <div className="absolute left-1/2 transform -translate-x-1/2 -bottom-16">
          <Avatar className="h-32 w-32 border-4 border-background">
            <AvatarImage
              src={community.profilePicture || "/placeholder.png"}
              alt={community.name}
              className="object-cover"
            />
            <AvatarFallback className="text-2xl">
              {community.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Community information */}
      <div className="flex flex-col items-center mt-20 px-6">
        <h1 className="text-3xl font-bold text-center">{community.name}</h1>

        <div className="flex items-center gap-2 my-2">
          <Badge variant="secondary" className="px-2 py-0.5">
            <Users className="h-3 w-3 mr-1" />
            {community?.memberDetails?.length} Members
          </Badge>
          <Badge variant="secondary" className="px-2 py-0.5">
            <MessageSquare className="h-3 w-3 mr-1" />
            {community.postCount || 0} Posts
          </Badge>
        </div>

        <TruncatedText
          text={community.description || ""}
          limit={100}
          placeholderText={"No bio available"}
          className="text-foreground text-sm text-center mx-auto max-w-[35vw]"
        />

        {/* {community.interest && (
          <TruncatedList
            items={community.interest.split(",")}
            limit={5}
            className="mt-3 w-full"
            itemsContainerClassName="flex flex-wrap justify-center gap-2 max-w-[80%] mx-auto"
            renderItem={(interest, index) => (
              <span 
                key={index} 
                className="bg-muted font-semibold text-foreground border border-primary text-xs px-2 py-1 rounded-full"
              >
                {interest}
              </span>
            )}
          />
        )} */}

        <div className="mt-6">
          {isUserMember ? (
            <div className="flex gap-3">
              <Link to={`/community/${communityId}/post`}>
                <Button
                  variant="default"
                  className="rounded-full text-foreground border-destructive cursor-pointer"
                  disabled={isMembershipLoading}
                >
                  + Post
                </Button>
              </Link>
              <Button
                variant="outline"
                className="rounded-full text-foreground border-destructive cursor-pointer"
                onClick={handleLeaveCommunity}
                disabled={isMembershipLoading}
              >
                {isMembershipLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Leave
              </Button>

            </div>
          ) : (
            <Button
              className="rounded-full cursor-pointer"
              onClick={handleJoinCommunity}
              disabled={isMembershipLoading}
            >
              {isMembershipLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Join
            </Button>
          )}
          {/* <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => {
              // Share functionality would go here
              navigator.clipboard.writeText(window.location.href);
            }}
          >
            <Share2 className="h-4 w-4" />
          </Button> */}
        </div>
      </div>

      <div className="flex-1 mt-8">
        <Tabs defaultValue="feed" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-background/30 rounded-lg backdrop-blur-sm mb-4 *:rounded-md *:m-1 *:data-[state=active]:bg-accent *:data-[state=active]:text-foreground *:text-muted-foreground">
            <TabsTrigger value="feed" className="cursor-pointer">News Feed</TabsTrigger>
            <TabsTrigger value="posts" className="cursor-pointer">Recent</TabsTrigger>
            <TabsTrigger value="quotes" className="cursor-pointer">Comments</TabsTrigger>
            <TabsTrigger value="members" className="cursor-pointer">Members</TabsTrigger>
          </TabsList>

          {/* <TabsContent value="about" className="p-4">
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-muted-foreground">{community.description}</p>

              <h3 className="font-semibold mt-4 mb-2">Interest</h3>
              <Badge className="bg-primary/20 text-foreground border-primary">
                {community.interest}
              </Badge>

              <h3 className="font-semibold mt-4 mb-2">Created</h3>
              <p className="text-muted-foreground">
                {new Date(community.createdAt).toLocaleDateString()}
              </p>
            </div>
          </TabsContent> */}

          <TabsContent value="feed" className="p-4">
            {isLoadingPosts ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : communityPosts.length > 0 ? (
              <CommunityQuotes showMediaPosts={true} posts={communityPosts}
                communityId={communityId || ''} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No Posts
              </div>
            )}
          </TabsContent>

          <TabsContent value="posts" className="p-4">
            {isLoadingPosts ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : mediaPosts.length > 0 ? (
              <CommunityPosts posts={mediaPosts} communityId={communityId || ''} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No Posts
              </div>
            )}
          </TabsContent>

          <TabsContent value="quotes" className="p-4">
            {isLoadingPosts ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : quotePosts.length > 0 ? (
              <CommunityQuotes showMediaPosts={false} posts={quotePosts} communityId={communityId || ''} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No Quotes
              </div>
            )}
          </TabsContent>

          <TabsContent value="members" className="p-4">
            {community?.memberDetails && community.memberDetails.length > 0 ? (
              <CommunityMemberList memberDetails={community.memberDetails} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No Members in the Community
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CommunityProfilePage;
