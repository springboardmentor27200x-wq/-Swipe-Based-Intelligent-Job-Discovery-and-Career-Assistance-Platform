// =====================================================
// SAVED JOBS
// =====================================================

const container =
    document.getElementById("savedJobsContainer");


// =====================================================
// GET SAVED JOBS
// =====================================================

const savedJobs =
    JSON.parse(
        localStorage.getItem("savedJobs")
    ) || [];


// =====================================================
// DISPLAY SAVED JOBS
// =====================================================

if (savedJobs.length === 0) {

    container.innerHTML = `

        <div class="no-jobs">

            <h2>
                No Saved Jobs Yet!
            </h2>

            <p>
                Jobs you save will appear here.
            </p>

        </div>

    `;

} else {

    savedJobs.forEach(function (job) {

        container.innerHTML += `

            <div class="job-card">

                <span class="saved-label">
                    🔖 Saved Job
                </span>

                <h2>
                    ${job.company || "Unknown Company"}
                </h2>

                <h3>
                    ${job.title || "Job"}
                </h3>

                <p>
                    <b>📍 Location:</b>
                    ${job.location || "Not specified"}
                </p>

                <p>
                    <b>💰 Salary:</b>
                    ${job.salary || "Not specified"}
                </p>

                <p>
                    <b>👨‍💻 Experience:</b>
                    ${job.experience || "Not specified"}
                </p>

                <p class="job-description">
                    ${job.description || "No description available."}
                </p>

            </div>

        `;

    });

}


// =====================================================
// GO TO DASHBOARD
// =====================================================

function goToDashboard() {

    console.log("Saved Jobs: Dashboard clicked");


    // -------------------------------------------------
    // FIRST: TRY THE SAME DIRECT METHOD THAT WORKED
    // FOR YOUR JOBS PAGE
    // -------------------------------------------------

    if (
        window.parent &&
        window.parent !== window
    ) {

        try {

            if (
                typeof window.parent.loadPage ===
                "function"
            ) {

                console.log(
                    "Calling parent loadPage directly"
                );

                window.parent.loadPage(
                    "home.html"
                );

                return;

            }

        } catch (error) {

            console.log(
                "Direct parent loadPage failed:",
                error
            );

        }


        // -------------------------------------------------
        // FALLBACK: MESSAGE
        // -------------------------------------------------

        console.log(
            "Sending loadPage message to parent"
        );

        window.parent.postMessage(
            {
                action: "loadPage",
                page: "home.html"
            },
            "*"
        );

        return;
    }


    // -------------------------------------------------
    // IF SAVEDJOBS.HTML IS OPENED DIRECTLY
    // -------------------------------------------------

    console.log(
        "Saved Jobs opened directly"
    );

    window.location.href =
        "jobseeker.html";
}