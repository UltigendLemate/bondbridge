import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SetupProfile from './pages/SetupProfile';
import './App.css'
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import Notifications from './pages/Notifications';
import Search from './pages/Search';
import CommentsPage from '@/pages/CommentsPage';
import Activity from '@/pages/Activity';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/login" element={<Layout><Login /></Layout>} />
          <Route path="/signup" element={<Layout><Signup /></Layout>} />
          <Route path="/setup-profile" element={<Layout><SetupProfile /></Layout>} />
          <Route path="/" element={<Layout showSidebars={true}><HomePage /></Layout>} />
          <Route path="/notifications" element={<Layout showSidebars={true}><Notifications /></Layout>} />
          <Route path="/search" element={<Layout showSidebars={true}><Search /></Layout>} />
          <Route path="/comments/:postId" element={<Layout showSidebars={true}><CommentsPage /></Layout>} />
          <Route path="/activity" element={<Layout showSidebars={true}><Activity /></Layout>} />
        </Routes>
      </Router>
    </Provider>
  );
}

export default App;
