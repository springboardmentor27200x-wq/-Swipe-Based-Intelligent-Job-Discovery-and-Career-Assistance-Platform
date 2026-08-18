import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import JobSeekerDashboard from "./pages/JobSeekerDashboard";
import Jobs from "./pages/Jobs";
import SwipeJobs from "./pages/SwipeJobs";
import SavedJobs from "./pages/SavedJobs";
import AppliedJobs from "./pages/AppliedJobs";
import Notifications from "./pages/Notifications";
import Recommendations from "./pages/Recommendations";
import Profile from "./pages/Profile";

import RecruiterDashboard from "./pages/RecruiterDashboard";
import PostJob from "./pages/PostJob";
import MyJobs from "./pages/MyJobs";
import Applicants from "./pages/Applicants";
import CompanyProfile from "./pages/CompanyProfile";
import EditJob from "./pages/EditJob";

import Companies from "./pages/Companies";

function App() {
  return (
    <Routes>

      {/* AUTH */}
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />


      {/* JOB SEEKER */}
      <Route
        path="/dashboard"
        element={<JobSeekerDashboard />}
      />

      <Route
        path="/jobs"
        element={<Jobs />}
      />

      <Route
        path="/swipe"
        element={<SwipeJobs />}
      />

      <Route
        path="/saved"
        element={<SavedJobs />}
      />

      <Route
        path="/applied"
        element={<AppliedJobs />}
      />

      <Route
        path="/notifications"
        element={<Notifications />}
      />

      <Route
        path="/recommendations"
        element={<Recommendations />}
      />

      <Route
        path="/profile"
        element={<Profile />}
      />


      {/* RECRUITER */}
      <Route
        path="/recruiter"
        element={<RecruiterDashboard />}
      />

      <Route
        path="/post-job"
        element={<PostJob />}
      />

      <Route
        path="/my-jobs"
        element={<MyJobs />}
      />

      <Route
        path="/applicants"
        element={<Applicants />}
      />

      <Route
        path="/company-profile"
        element={<CompanyProfile />}
      />

      <Route
        path="/edit-job/:id"
        element={<EditJob />}
      />


      {/* COMPANIES */}
      <Route
        path="/companies"
        element={<Companies />}
      />

    </Routes>
  );
}

export default App;