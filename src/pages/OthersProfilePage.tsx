import Profile from "@/components/Profile";
import avatar from "/profile/user.png";

export default function OthersProfilePage() {
  // Mock data for demonstration
  const userData = {
    userId: "user123", // Add a userId for the profile
    username: "Others Profile",
    email: "",  // We might not show email for other profiles
    bio: "This is a sample bio for demonstration purposes.", // Added bio
    followers: 20034,
    following: 3987,
    avatarSrc: avatar,
    isCurrentUser: false, // This ensures we show the Message/Add Friend buttons instead of Settings
  };

  return (
    <Profile 
      userId={userData.userId}
      username={userData.username}
      email={userData.email}
      bio={userData.bio}
      followers={userData.followers}
      following={userData.following}
      avatarSrc={userData.avatarSrc}
      isCurrentUser={userData.isCurrentUser}
    />
  );
} 