import { Button } from "@/components/ui/button";
import { useApiCall } from "@/apis/globalCatchError";
import {
  acceptFriendRequest,
  rejectFriendRequest,
  FollowRequest
} from "@/apis/commonApiCalls/notificationsApi";

interface FriendRequestProps extends FollowRequest {
  onActionComplete: (
    requestId: string,
    success: boolean,
    action: "accept" | "reject"
  ) => void;
}

const FriendRequest = ({
  _id,
  name,
  avatar,
  nickName,
  onActionComplete,
}: FriendRequestProps) => {
  const [executeAccept, isAccepting] = useApiCall(acceptFriendRequest);
  const [executeReject, isRejecting] = useApiCall(rejectFriendRequest);

  const handleAccept = async () => {
    // Notify parent to remove the request immediately
    onActionComplete(_id, true, "accept");

    // Try to accept the request
    const result = await executeAccept({ otherId: _id });

    // If it fails, notify parent to restore the request
    if (!result.success) {
      onActionComplete(_id, false, "accept");
    }
  };

  const handleReject = async () => {
    // Notify parent to remove the request immediately
    onActionComplete(_id, true, "reject");

    // Try to reject the request
    const result = await executeReject({ otherId: _id });

    // If it fails, notify parent to restore the request
    if (!result.success) {
      onActionComplete(_id, false, "reject");
    }
  };

  const isLoading = isAccepting || isRejecting;

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        <img
          src={avatar}
          alt={name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <h3 className="font-medium">{name}</h3>
          <p className="text-sm text-muted-foreground">{nickName}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleReject} disabled={isLoading}>
          Reject
        </Button>
        <Button onClick={handleAccept} disabled={isLoading}>
          Accept
        </Button>
      </div>
    </div>
  );
};

export default FriendRequest;
