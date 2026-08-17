const API_URL =
    window.SWIPEX_API_URL;
    
const jobsList =
    document.getElementById("jobsList");


// =====================================
// LOAD JOBS
// =====================================

loadJobs();


async function loadJobs() {

    jobsList.innerHTML = `
        <div class="empty-message">
            Loading jobs...
        </div>
    `;


    try {

        const response =
            await fetch(
                `${API_URL}/jobs`
            );


        if (!response.ok) {

            throw new Error(
                `Failed to load jobs: ${response.status}`
            );

        }


        const jobs =
            await response.json();


        jobsList.innerHTML = "";


        // ---------------------------------
        // NO JOBS
        // ---------------------------------

        if (
            !Array.isArray(jobs) ||
            jobs.length === 0
        ) {

            jobsList.innerHTML = `

                <div class="empty-message">

                    <h2>
                        No Jobs Posted Yet
                    </h2>

                    <p>
                        Add your first job posting
                        from the recruiter dashboard.
                    </p>

                </div>

            `;

            return;

        }


        // ---------------------------------
        // DISPLAY JOBS
        // ---------------------------------

        jobs.forEach(
            job => {

                const card =
                    document.createElement("div");


                card.className =
                    "job-card";


                const applicantCount =
                    Number(
                        job.applicant_count
                    ) || 0;


                card.innerHTML = `

                    <div class="job-header">

                        <div>

                            <div class="job-company">
                                ${escapeHTML(
                                    job.company ||
                                    "Unknown Company"
                                )}
                            </div>


                            <h2 class="job-title">
                                ${escapeHTML(
                                    job.title ||
                                    "Untitled Job"
                                )}
                            </h2>

                        </div>


                        <span class="job-status">
                            ● Active
                        </span>

                    </div>


                    <div class="job-details">


                        <div class="detail">

                            <span class="detail-label">
                                📍 Location
                            </span>

                            <span class="detail-value">
                                ${escapeHTML(
                                    job.location ||
                                    "Not specified"
                                )}
                            </span>

                        </div>


                        <div class="detail">

                            <span class="detail-label">
                                💰 Salary
                            </span>

                            <span class="detail-value">
                                ${escapeHTML(
                                    job.salary ||
                                    "Not specified"
                                )}
                            </span>

                        </div>


                        <div class="detail">

                            <span class="detail-label">
                                🎓 Experience
                            </span>

                            <span class="detail-value">
                                ${escapeHTML(
                                    job.experience ||
                                    "Not specified"
                                )}
                            </span>

                        </div>


                        <div class="detail">

                            <span class="detail-label">
                                👥 Applicants
                            </span>

                            <span class="detail-value">
                                ${applicantCount}
                            </span>

                        </div>


                    </div>


                    <p class="job-description">

                        ${escapeHTML(
                            job.description ||
                            "No description provided."
                        )}

                    </p>


                    <div class="job-footer">


                        <div class="applicant-info">

                            👥

                            <span>
                                ${applicantCount}
                            </span>

                            applicant(s)

                        </div>


                        <button
                            type="button"
                            class="delete-button"
                            onclick="deleteJob(
                                ${Number(job.id)},
                                '${escapeJS(
                                    job.title || "this job"
                                )}'
                            )">

                            🗑 Delete Job

                        </button>


                    </div>

                `;


                jobsList.appendChild(
                    card
                );

            }
        );

    }


    catch (error) {

        console.error(
            "Posted Jobs Error:",
            error
        );


        jobsList.innerHTML = `

            <div class="error-message">

                <h2>
                    ⚠ Unable to Load Jobs
                </h2>

                <p>
                    Please make sure the SwipeX
                    backend is running.
                </p>

            </div>

        `;

    }

}



// =====================================
// DELETE JOB
// =====================================

async function deleteJob(
    jobId,
    jobTitle
) {

    const confirmDelete =
        confirm(
            `Are you sure you want to delete "${jobTitle}"?`
        );


    if (!confirmDelete) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API_URL}/jobs/${jobId}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            const errorText =
                await response.text();


            console.error(
                "Delete error:",
                errorText
            );


            alert(
                "Unable to delete this job."
            );


            return;

        }


        alert(
            "Job deleted successfully."
        );


        // Reload the list

        await loadJobs();

    }


    catch (error) {

        console.error(
            "Delete Job Error:",
            error
        );


        alert(
            "Backend not running."
        );

    }

}



// =====================================
// BACK TO RECRUITER DASHBOARD
// =====================================

function backToRecruiterDashboard() {

    try {

        /*
         * recruiter.html is the parent page.
         *
         * It already has loadPage(page),
         * so use that instead of changing
         * window.location.
         */

        if (
            window.parent &&
            typeof window.parent.loadPage ===
            "function"
        ) {

            window.parent.loadPage(
                "recruiter_home.html"
            );

            return;

        }

    }


    catch (error) {

        console.error(
            "Direct dashboard navigation failed:",
            error
        );

    }


    // ---------------------------------
    // FALLBACK
    // ---------------------------------

    try {

        window.parent.postMessage(
            {
                action: "loadPage",
                page: "recruiter_home.html"
            },
            "*"
        );

    }


    catch (error) {

        console.error(
            "Dashboard navigation failed:",
            error
        );

    }

}



// =====================================
// ESCAPE HTML
// =====================================

function escapeHTML(
    value
) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}



// =====================================
// ESCAPE JAVASCRIPT STRING
// =====================================

function escapeJS(
    value
) {

    return String(value)

        .replace(
            /\\/g,
            "\\\\"
        )

        .replace(
            /'/g,
            "\\'"
        )

        .replace(
            /"/g,
            '\\"'
        )

        .replace(
            /\n/g,
            "\\n"
        )

        .replace(
            /\r/g,
            "\\r"
        );

}