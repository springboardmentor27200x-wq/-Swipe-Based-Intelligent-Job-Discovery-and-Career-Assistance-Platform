import { useEffect, useState } from "react";
import axios from "../api";
import Sidebar from "../components/Sidebar";

function Companies() {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await axios.get("companies/");
      setCompanies(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="flex">
      <Sidebar />

      <div className="ml-64 flex-1 p-10 bg-gray-100 min-h-screen">
        <h1 className="text-4xl font-bold mb-8">
          🏢 Companies
        </h1>

        <div className="grid grid-cols-3 gap-6">

          {companies.map((company) => (

            <div
              key={company.id}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold">
                {company.name}
              </h2>

              <p className="mt-2">
                <b>Type:</b> {company.company_type}
              </p>

              <p>
                <b>Location:</b> {company.location}
              </p>

              <p>
                <b>Website:</b> {company.website}
              </p>

              <p className="mt-3 text-gray-600">
                {company.description}
              </p>

            </div>

          ))}

        </div>

      </div>
    </div>
  );
}

export default Companies;