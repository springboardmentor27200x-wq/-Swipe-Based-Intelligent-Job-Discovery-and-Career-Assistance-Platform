import { useState } from "react";
import axios from "../api";
import Sidebar from "../components/Sidebar";

export default function PostJob() {
  const [job, setJob] = useState({
    title: "",
    description: "",
    location: "",
    salary: "",
    job_type: "",
    experience: "",
    company: 1,
  });

  const handleSubmit = () => {
    axios.post("jobs/", job)
      .then(() => {
        alert("Job Posted Successfully!");
      })
      .catch(console.log);
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="ml-64 p-8 w-full">

        <h1 className="text-3xl font-bold mb-6">
          Post New Job
        </h1>

        <input
          className="border p-3 w-full mb-4"
          placeholder="Job Title"
          onChange={(e) =>
            setJob({ ...job, title: e.target.value })
          }
        />

        <textarea
          className="border p-3 w-full mb-4"
          placeholder="Description"
          onChange={(e) =>
            setJob({ ...job, description: e.target.value })
          }
        />

        <input
          className="border p-3 w-full mb-4"
          placeholder="Location"
          onChange={(e) =>
            setJob({ ...job, location: e.target.value })
          }
        />

        <input
          className="border p-3 w-full mb-4"
          placeholder="Salary"
          onChange={(e) =>
            setJob({ ...job, salary: e.target.value })
          }
        />

        <input
          className="border p-3 w-full mb-4"
          placeholder="Job Type"
          onChange={(e) =>
            setJob({ ...job, job_type: e.target.value })
          }
        />

        <input
          className="border p-3 w-full mb-6"
          placeholder="Experience"
          onChange={(e) =>
            setJob({ ...job, experience: e.target.value })
          }
        />

        <button
          onClick={handleSubmit}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg"
        >
          Post Job
        </button>

      </div>
    </div>
  );
}