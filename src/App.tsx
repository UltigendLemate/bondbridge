import React from "react";
import { BrowserRouter as Router, Route, Routes} from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import { SocketProvider } from "./context/SocketContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import SetupProfile from "./pages/SetupProfile";
import "./App.css";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import Notifications from "./pages/Notifications";
import Search from "./pages/Search";
import CommentsPage from "@/pages/PostPage";
import CreateGroup from "./pages/CreateGroup";
import ProfilePage from "@/pages/ProfilePage";
import OthersProfilePage from "./pages/OthersProfilePage";
import Activity from "@/pages/Activity";
import BondChat from "./pages/BondChat";
import StoryPage from "@/pages/StoryPage";
import CreatePost from "./pages/CreatePost";
import EditPost from "./pages/EditPost";
import CreateStory from "./pages/CreateStory";
import Settings from "./pages/Settings";
import ForgotPassword from "./pages/ForgotPassword";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TnC from "./pages/TnC";
import FollowingFollowers from "@/components/FollowingFollowers";
import AuthGuard from "@/components/AuthGuard";
import CommunityProfilePage from "@/pages/CommunityProfilePage";
import NotFound from "./pages/NotFound";
import CommunityPostPage from "@/pages/CommunityPostPage";

// Component for routes that require authentication and socket connection
const AuthenticatedRoutes: React.FC = () => {
  return (
    <SocketProvider>
      <AuthGuard>
        <Routes>
          <Route
            path="/"
            element={
              <Layout showSidebars={true}>
                <HomePage />
              </Layout>
            }
          />
          <Route
            path="/notifications"
            element={
              <Layout showSidebars={true}>
                <Notifications />
              </Layout>
            }
          />
          <Route
            path="/search"
            element={
              <Layout showSidebars={true}>
                <Search />
              </Layout>
            }
          />
          <Route
            path="/post/:postId"
            element={
              <Layout showSidebars={true}>
                <CommentsPage />
              </Layout>
            }
          />
          <Route
            path="/activity"
            element={
              <Layout showSidebars={true}>
                <Activity />
              </Layout>
            }
          />
          <Route
            path="/create-group"
            element={
              <Layout showSidebars={false}>
                <CreateGroup />
              </Layout>
            }
          />
          <Route
            path="/profile/:userId"
            element={
              <Layout showSidebars={true}>
                <ProfilePage />
              </Layout>
            }
          />
          <Route
            path="/following-followers"
            element={
              <Layout showSidebars={true}>
                <FollowingFollowers />
              </Layout>
            }
          />
          <Route
            path="/settings"
            element={
              <Layout showSidebars={true}>
                <Settings />
              </Layout>
            }
          />
          <Route
            path="/others-profile"
            element={
              <Layout showSidebars={true}>
                <OthersProfilePage />
              </Layout>
            }
          />
          <Route
            path="/bondchat"
            element={
              <Layout showSidebars={true} className="py-0">
                <BondChat />
              </Layout>
            }
          />
          <Route
            path="/story/:userId"
            element={
              <Layout showSidebars={true} className="!p-0">
                <StoryPage />
              </Layout>
            }
          />
          <Route
            path="/create-post"
            element={
              <Layout showSidebars={true}>
                <CreatePost />
              </Layout>
            }
          />
          <Route
            path="/community/:communityId/post"
            element={
              <Layout showSidebars={true}>
                <CreatePost communityPost={true} />
              </Layout>
            }
          />
          <Route
            path="/edit-post/:postId"
            element={
              <Layout showSidebars={true}>
                <EditPost />
              </Layout>
            }
          />
          <Route
            path="/create-story"
            element={
              <Layout showSidebars={true} className="!p-0">
                <CreateStory />
              </Layout>
            }
          />
          <Route
            path="/community/:communityId"
            element={
              <Layout showSidebars={true}>
                <CommunityProfilePage />
              </Layout>
            }
          />
          {/* 404 page for authenticated routes */}
          <Route
            path="*"
            element={
              // <Layout showSidebars={false}>
                <NotFound />
              // </Layout>
            }
          />
          <Route
            path="/community/:communityId/:postId"
            element={
              <Layout showSidebars={true}>
                <CommunityPostPage />
              </Layout>
            }
          />
        </Routes>
      </AuthGuard>
    </SocketProvider>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          {/* Authentication routes without SocketProvider */}
          <Route
            path="/login"
            element={
              <Layout>
                <Login />
              </Layout>
            }
          />
          <Route
            path="/signup"
            element={
              <Layout>
                <Signup />
              </Layout>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <Layout>
                <ForgotPassword />
              </Layout>
            }
          />
          <Route
            path="/privacy"
            element={
              <Layout>
                <PrivacyPolicy />
              </Layout>
            }
          />
          <Route
            path="/terms"
            element={
              <Layout>
                <TnC />
              </Layout>
            }
          />
          <Route
            path="/setup-profile"
            element={
              <Layout>
                <SetupProfile />
              </Layout>
            }
          />
          {/* All other routes with SocketProvider */}
          <Route path="/*" element={<AuthenticatedRoutes />} />
        </Routes>
      </Router>
    </Provider>
  );
};

export default App;