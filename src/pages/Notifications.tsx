import { useEffect, useState } from "react";
import FriendRequest from "@/components/notifications/FriendRequest";
import Notification from "@/components/notifications/Notification";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Notification as NotificationType,
  FollowRequest,
  fetchNotifications,
  fetchFollowRequests,
} from "@/apis/commonApiCalls/notificationsApi";
import { useApiCall } from "@/apis/globalCatchError";
import { NotificationsListSkeleton } from "@/components/skeletons/NotificationSkeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Bell, UserPlus, AlertCircle } from "lucide-react";

const Notifications = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [friendRequests, setFriendRequests] = useState<FollowRequest[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [executeNotificationsFetch, isLoadingNotifications] =
    useApiCall(fetchNotifications);
  const [executeFollowRequestsFetch, isLoadingFollowRequests] =
    useApiCall(fetchFollowRequests);

  const isLoading = isLoadingNotifications || isLoadingFollowRequests;

  const handleMarkAsSeen = (notificationId: number) => {
    setNotifications((prevNotifications) =>
      prevNotifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, seen: true }
          : notification
      )
    );
  };

  const loadData = async () => {
    try {
      // Fetch notifications
      const notificationsResult = await executeNotificationsFetch();
      if (notificationsResult.success && notificationsResult.data?.success) {
        setNotifications(notificationsResult.data.notifications);
        setError(null);
      } else {
        setError(notificationsResult.data?.message || "Failed to load notifications");
      }

      // Fetch follow requests with pagination
      const followRequestsResult = await executeFollowRequestsFetch({
        page: 1,
        limit: 10,
      });
      if (followRequestsResult.success && followRequestsResult.data) {
        setFriendRequests(followRequestsResult.data.result || []);
      }
    } catch (err) {
      console.log("err: ", err);
      setError("An error occurred while loading notifications");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFriendRequestAction = async (
    requestId: string,
    success: boolean
  ) => {
    if (success) {
      // If the action was successful, keep the request removed
      setFriendRequests((prev) => prev.filter((req) => req._id !== requestId));
    } else {
      // If the action failed, add the request back
      const failedRequest = friendRequests.find((req) => req._id === requestId);
      if (failedRequest) {
        setFriendRequests((prev) => [...prev, failedRequest]);
      }
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  return (
    <div className="w-full">
      <h1 className="text-4xl font-semibold mb-5">Notifications</h1>

      {isLoading ? (
        <NotificationsListSkeleton />
      ) : error ? (
        <EmptyState
          icon={AlertCircle}
          title="Couldn't load notifications"
          description={error}
          actionLabel="Try Again"
          onAction={handleRefresh}
          className="my-8"
        />
      ) : (
        <Tabs defaultValue="notifications" className="">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="notifications">
              Notifications{" "}
              {notifications.filter((n) => !n.seen).length > 0 &&
                `(${notifications.filter((n) => !n.seen).length})`}
            </TabsTrigger>
            <TabsTrigger value="friend-requests">
              Friend Requests{" "}
              {friendRequests.length > 0 && `(${friendRequests.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="mt-4">
            <div className="space-y-4">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <Notification
                    key={notification.id}
                    {...notification}
                    onMarkAsSeen={handleMarkAsSeen}
                  />
                ))
              ) : (
                <EmptyState
                  icon={Bell}
                  title="No notifications"
                  description="You don't have any notifications yet. We'll notify you when something happens."
                  className="my-8"
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="friend-requests" className="mt-4">
            <div className="space-y-4">
              {friendRequests.length > 0 ? (
                friendRequests.map((request) => (
                  <FriendRequest
                    key={request._id}
                    {...request}
                    onActionComplete={handleFriendRequestAction}
                  />
                ))
              ) : (
                <EmptyState
                  icon={UserPlus}
                  title="No friend requests"
                  description="You don't have any friend requests at the moment."
                  className="my-8"
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Notifications;