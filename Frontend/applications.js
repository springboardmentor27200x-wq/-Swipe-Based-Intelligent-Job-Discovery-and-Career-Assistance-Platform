const list =
    document.getElementById(
        "applicationsList"
    );


// =====================================================
// GET APPLICATIONS
// =====================================================

let applications =
    JSON.parse(
        localStorage.getItem(
            "applications"
        )
    ) || [];


// =====================================================
// GET RESUME DATA
// =====================================================

function getResumeData() {

    try {

        return JSON.parse(
            localStorage.getItem(
                "resumeData"
            )
        ) || {};

    }

    catch (error) {

        console.error(
            "Invalid resumeData:",
            error
        );

        return {};

    }

}


// =====================================================
// NORMALIZE TEXT
// =====================================================

function normalizeText(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

}


// =====================================================
// GET RECOMMENDATIONS
// =====================================================

function getRecommendations() {

    const resumeData =
        getResumeData();


    return Array.isArray(
        resumeData.recommendations
    )
        ? resumeData.recommendations
        : [];

}


// =====================================================
// FIND RECOMMENDATION
// =====================================================

function findRecommendation(job) {

    if (!job) {

        return null;

    }


    const recommendations =
        getRecommendations();


    const jobId =
        String(
            job.job_id ??
            job.id ??
            ""
        );


    const company =
        normalizeText(
            job.company
        );


    const title =
        normalizeText(
            job.title
        );


    // =================================================
    // MATCH BY ID
    // =================================================

    let recommendation =
        recommendations.find(
            function (rec) {

                const recId =
                    String(
                        rec.id ??
                        rec.job_id ??
                        ""
                    );


                return (
                    jobId !== "" &&
                    recId !== "" &&
                    jobId === recId
                );

            }
        );


    if (recommendation) {

        return recommendation;

    }


    // =================================================
    // MATCH BY COMPANY + TITLE
    // =================================================

    recommendation =
        recommendations.find(
            function (rec) {

                const recCompany =
                    normalizeText(
                        rec.company
                    );


                const recTitle =
                    normalizeText(
                        rec.job ??
                        rec.title
                    );


                return (
                    recCompany === company &&
                    recTitle === title
                );

            }
        );


    if (recommendation) {

        return recommendation;

    }


    // =================================================
    // PARTIAL TITLE MATCH
    // =================================================

    recommendation =
        recommendations.find(
            function (rec) {

                const recCompany =
                    normalizeText(
                        rec.company
                    );


                const recTitle =
                    normalizeText(
                        rec.job ??
                        rec.title
                    );


                return (
                    recCompany === company &&
                    (
                        recTitle.includes(title) ||
                        title.includes(recTitle)
                    )
                );

            }
        );


    return recommendation || null;

}


// =====================================================
// GET MATCH PERCENTAGE
// =====================================================

function getMatchPercentage(job) {

    if (!job) {

        return 0;

    }


    // =================================================
    // 1. SAVED APPLICATION MATCH
    // =================================================

    const savedMatch =
        job.match ??
        job.match_percentage ??
        job.matchPercentage;


    if (
        savedMatch !== undefined &&
        savedMatch !== null &&
        savedMatch !== ""
    ) {

        const number =
            Number(savedMatch);


        if (
            !isNaN(number) &&
            number > 0
        ) {

            return Math.round(number);

        }

    }


    // =================================================
    // 2. FIND ORIGINAL RECOMMENDATION
    // =================================================

    const recommendation =
        findRecommendation(job);


    if (recommendation) {

        const recommendationMatch =
            recommendation.match ??
            recommendation.match_percentage ??
            recommendation.matchPercentage;


        if (
            recommendationMatch !== undefined &&
            recommendationMatch !== null &&
            recommendationMatch !== ""
        ) {

            const number =
                Number(
                    recommendationMatch
                );


            if (!isNaN(number)) {

                return Math.round(number);

            }

        }

    }


    // =================================================
    // 3. FALLBACK
    // =================================================

    const resumeData =
        getResumeData();


    const overallMatch =
        resumeData.match_percentage ??
        resumeData.matchPercentage ??
        resumeData.match;


    if (
        overallMatch !== undefined &&
        overallMatch !== null &&
        overallMatch !== ""
    ) {

        const number =
            Number(overallMatch);


        if (!isNaN(number)) {

            return Math.round(number);

        }

    }


    return 0;

}


// =====================================================
// REPAIR OLD APPLICATIONS
// =====================================================

function repairApplications() {

    let changed =
        false;


    applications =
        applications.map(
            function (job) {

                const match =
                    getMatchPercentage(job);


                const recommendation =
                    findRecommendation(job);


                if (
                    match > 0 &&
                    (
                        !job.match ||
                        Number(job.match) === 0
                    )
                ) {

                    job.match =
                        match;


                    job.match_percentage =
                        match;


                    changed =
                        true;

                }


                if (
                    recommendation
                ) {

                    const matched =
                        recommendation.matched_skills ||
                        recommendation.matchedSkills ||
                        [];


                    const missing =
                        recommendation.missing_skills ||
                        recommendation.missingSkills ||
                        [];


                    if (
                        matched.length &&
                        !job.matched_skills
                    ) {

                        job.matched_skills =
                            matched;


                        changed =
                            true;

                    }


                    if (
                        missing.length &&
                        !job.missing_skills
                    ) {

                        job.missing_skills =
                            missing;


                        changed =
                            true;

                    }

                }


                return job;

            }
        );


    if (changed) {

        localStorage.setItem(
            "applications",
            JSON.stringify(
                applications
            )
        );

    }

}


// =====================================================
// DISPLAY APPLICATIONS
// =====================================================

function displayApplications() {

    list.innerHTML =
        "";


    if (
        applications.length === 0
    ) {

        list.innerHTML = `

            <div class="empty">

                <h2>
                    No Applications Yet
                </h2>

                <p>
                    Apply to a recommended job
                    and it will appear here.
                </p>

            </div>

        `;

        return;

    }


    applications.forEach(
        function (job, index) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "application-card";


            const matchPercentage =
                getMatchPercentage(job);


            card.innerHTML = `

                <div>

                    <p class="company">
                        🏢 ${job.company || "Unknown Company"}
                    </p>

                    <h2>
                        ${job.title || "Unknown Job"}
                    </h2>

                    <p>
                        📍 ${job.location || "Not specified"}
                    </p>

                    <p>
                        💰 ${job.salary || "Salary not specified"}
                    </p>

                </div>


                <div class="application-details">

                    <p>
                        <b>Resume Compatibility</b>
                    </p>

                    <p class="match-value">
                        ${matchPercentage}% Match
                    </p>

                    <p>
                        <b>Status:</b>

                        <span class="status">
                            Applied ✓
                        </span>
                    </p>


                    <button
                        type="button"
                        class="cancel-btn"
                        onclick="withdrawApplication(${index})">

                        ❌ Withdraw Application

                    </button>

                </div>

            `;


            list.appendChild(
                card
            );

        }
    );

}


// =====================================================
// WITHDRAW APPLICATION
// =====================================================

function withdrawApplication(index) {

    if (
        index < 0 ||
        index >= applications.length
    ) {

        return;

    }


    const job =
        applications[index];


    const jobTitle =
        job.title ||
        "this job";


    const confirmed =
        confirm(
            `Are you sure you want to withdraw your application for "${jobTitle}"?`
        );


    if (!confirmed) {

        return;

    }


    applications.splice(
        index,
        1
    );


    localStorage.setItem(
        "applications",
        JSON.stringify(
            applications
        )
    );


    // =================================================
    // SAVE WITHDRAWN JOB
    // =================================================

    let withdrawnJobs =
        JSON.parse(
            localStorage.getItem(
                "withdrawnJobs"
            )
        ) || [];


    withdrawnJobs.push(
        job
    );


    localStorage.setItem(
        "withdrawnJobs",
        JSON.stringify(
            withdrawnJobs
        )
    );


    displayApplications();

}


// =====================================================
// BACK TO DASHBOARD
// =====================================================

function goBackToDashboard() {

    if (
        window.parent &&
        window.parent !== window
    ) {

        window.parent.postMessage(
            {
                action:
                    "loadPage",

                page:
                    "home.html"

            },
            "*"
        );


        return;

    }


    window.location.href =
        "jobseeker.html";

}


// =====================================================
// START
// =====================================================

// First repair old applications
repairApplications();

// Then display
displayApplications();