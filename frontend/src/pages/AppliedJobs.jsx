import { useEffect, useState } from "react";
import axios from "../api";
import Sidebar from "../components/Sidebar";

function AppliedJobs() {
  const [applications, setApplications] = useState([]);

  useEffect(() => {
    axios
      .get("apply/")
      .then((res) => setApplications(res.data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="flex">
      <Sidebar />

      <div className="ml-64 flex-1 p-10 bg-gray-100 min-h-screen">
        <h1 className="text-4xl font-bold mb-8">
          📄 Applied Jobs
        </h1>

        {applications.map((item) => (
          <div
  key={item.id}
  className="bg-white rounded-xl shadow p-6 mb-5"
>
  <h2 className="text-2xl font-bold">
    {item.job_title}
  </h2>

  <p>🏢 {item.company}</p>

  <p>📍 {item.location}</p>

  <p>📄 Status : {item.status}</p>
</div>
        ))}
      </div>
    </div>
  );
}

export default AppliedJobs;