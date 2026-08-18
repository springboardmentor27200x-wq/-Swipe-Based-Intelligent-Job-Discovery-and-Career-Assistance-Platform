import { useEffect, useState } from "react";
import axios from "../api";
import Sidebar from "../components/Sidebar";

function Recommendations() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const res = await axios.get("recommended-jobs/", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
      });

      setJobs(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="ml-64 flex-1 p-10 bg-gray-100 min-h-screen">

        <h1 className="text-4xl font-bold mb-8">
          🤖 AI Job Recommendations
        </h1>

        <p className="text-gray-500 mb-8">
          Jobs recommended according to your saved interests.
        </p>

        {jobs.map((job) => (
  <div
    key={job.id}
    className="bg-white rounded-2xl shadow-lg p-6 mb-6 hover:shadow-xl transition"
  >
    <div className="flex justify-between items-center">

      <div>
        <h2 className="text-2xl font-bold">
          {job.title}
        </h2>

        <p className="text-gray-600 mt-1">
          🏢 {job.company_name}
        </p>

        <p className="text-gray-600">
          📍 {job.location}
        </p>

        <p className="text-green-600 font-semibold mt-2">
          💰 ₹{job.salary}
        </p>

        <p className="text-gray-700 mt-3">
          {job.description}
        </p>
      </div>

      <div className="flex flex-col gap-3">

        <button
          className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700"
        >
          Apply
        </button>

        <button
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
        >
          Save
        </button>

      </div>

    </div>
  </div>
))}
      </div>
    </div>
  );
}

export default Recommendations;