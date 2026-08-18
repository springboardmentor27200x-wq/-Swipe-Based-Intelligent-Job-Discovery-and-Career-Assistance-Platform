import { useEffect, useState } from "react";
import axios from "../api";
import Sidebar from "../components/Sidebar";

function SavedJobs() {
  const [savedJobs, setSavedJobs] = useState([]);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const res = await axios.get("saved-jobs/", {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("access")}`,
  },
});
     console.log(res.data);
      setSavedJobs(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="ml-64 flex-1 p-10 bg-gray-100 min-h-screen">
        <h1 className="text-4xl font-bold mb-8">
          ❤️ Saved Jobs
        </h1>

        {savedJobs.map((item) => (
          <div
  key={item.id}
  className="bg-white rounded-xl shadow-lg p-6 mb-5"
>
  <h2 className="text-2xl font-bold">
    {item.job_title}
  </h2>

  <p>🏢 {item.company}</p>

  <p>📍 {item.location}</p>

  <p>❤️ Saved Successfully</p>
</div>
        ))}
      </div>
    </div>
  );
}

export default SavedJobs;