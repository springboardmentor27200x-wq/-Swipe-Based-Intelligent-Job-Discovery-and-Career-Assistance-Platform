import Sidebar from "../components/Sidebar";
import { useEffect, useState } from "react";
import axios from "../api";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

const handleLogout = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  navigate("/");
};
  return (
    <div className="grid grid-cols-4 gap-6 mt-10">

  <div className="bg-white rounded-xl shadow p-6">
    <h2 className="text-3xl font-bold">
      {stats.total_jobs}
    </h2>
    <p>Jobs Available</p>
  </div>

  <div className="bg-white rounded-xl shadow p-6">
    <h2 className="text-3xl font-bold">
      {stats.applied_jobs}
    </h2>
    <p>Applied Jobs</p>
  </div>

  <div className="bg-white rounded-xl shadow p-6">
    <h2 className="text-3xl font-bold">
      {stats.saved_jobs}
    </h2>
    <p>Saved Jobs</p>
  </div>

  <div className="bg-white rounded-xl shadow p-6">
    <h2 className="text-3xl font-bold">
      {stats.shortlisted}
    </h2>
    <p>Shortlisted</p>
  </div>

</div>
  );
}