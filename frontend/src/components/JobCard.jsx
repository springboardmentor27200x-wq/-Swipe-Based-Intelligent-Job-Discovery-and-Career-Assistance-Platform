import React from "react";

const JobCard = ({ job, onLike, onSkip }) => {
  if (!job) return <h2>No Jobs Available</h2>;

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 w-[400px]">
      <h2 className="text-2xl font-bold">{job.title}</h2>
      <h3>{job.company}</h3>
      <p>{job.location}</p>
      <p>{job.salary}</p>
      <p>{job.job_type}</p>

      <div className="flex justify-between mt-5">
        <button
          onClick={onSkip}
          className="bg-red-500 text-white px-5 py-2 rounded"
        >
          ❌ Skip
        </button>

        <button
          onClick={onLike}
          className="bg-green-500 text-white px-5 py-2 rounded"
        >
          ❤️ Interested
        </button>
      </div>
    </div>
  );
};

export default JobCard;