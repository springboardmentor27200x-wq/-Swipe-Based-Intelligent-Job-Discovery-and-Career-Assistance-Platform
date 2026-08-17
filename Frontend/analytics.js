const API_URL =
    window.SWIPEX_API_URL;


// ==========================================
// GET USERNAME
// ==========================================

function getUsername() {

    return (
        localStorage.getItem("swipex_username") ||
        localStorage.getItem("username") ||
        ""
    );

}


// ==========================================
// BACK TO JOB SEEKER DASHBOARD
// ==========================================

function goBackToDashboard() {

    try {

        if (
            window.parent &&
            window.parent !== window &&
            typeof window.parent.loadPage === "function"
        ) {

            window.parent.loadPage(
                "home.html"
            );

            return;

        }

    }
    catch (error) {

        console.error(
            "Dashboard navigation error:",
            error
        );

    }


    try {

        window.parent.postMessage(
            {
                action: "loadPage",
                page: "home.html"
            },
            "*"
        );

    }
    catch (error) {

        console.error(
            "Dashboard message error:",
            error
        );

    }

}


// ==========================================
// GET LOCAL APPLICATIONS
// ==========================================

function getLocalApplications() {

    try {

        const data =
            JSON.parse(
                localStorage.getItem(
                    "applications"
                )
            );


        if (Array.isArray(data)) {

            return data;

        }


        return [];

    }
    catch (error) {

        console.error(
            "Applications localStorage error:",
            error
        );

        return [];

    }

}


// ==========================================
// LOAD APPLICATIONS
// ==========================================

async function loadApplications() {

    const username =
        getUsername();


    let applications =
        getLocalApplications();


    if (!username) {

        return applications;

    }


    try {

        /*
         * Use backend application data when
         * available because recruiter status
         * changes should come from backend.
         */

        const response =
            await fetch(
                `${API_URL}/applications/${encodeURIComponent(username)}`
            );


        if (response.ok) {

            const data =
                await response.json();


            if (Array.isArray(data)) {

                applications = data;

            }

        }

    }
    catch (error) {

        console.warn(
            "Backend applications unavailable. Using localStorage.",
            error
        );

    }


    return applications;

}


// ==========================================
// NORMALIZE APPLICATION STATUS
// ==========================================

function normalizeStatus(status) {

    const value =
        String(
            status || "Pending"
        )
        .trim()
        .toLowerCase();


    if (
        value === "accepted" ||
        value === "accept" ||
        value === "selected" ||
        value === "approved"
    ) {

        return "accepted";

    }


    if (
        value === "rejected" ||
        value === "reject" ||
        value === "declined"
    ) {

        return "rejected";

    }


    return "pending";

}


// ==========================================
// APPLICATION ANALYTICS
// ==========================================

function displayApplicationAnalytics(
    applications
) {

    let accepted = 0;

    let pending = 0;

    let rejected = 0;


    applications.forEach(
        function(application) {

            const status =
                normalizeStatus(
                    application.status
                );


            if (
                status === "accepted"
            ) {

                accepted++;

            }

            else if (
                status === "rejected"
            ) {

                rejected++;

            }

            else {

                pending++;

            }

        }
    );


    // TOTAL APPLICATIONS

    document.getElementById(
        "totalApplications"
    ).textContent =
        applications.length;


    // TOP ACCEPTED CARD

    document.getElementById(
        "totalAccepted"
    ).textContent =
        accepted;


    // TOP PENDING CARD

    document.getElementById(
        "totalPending"
    ).textContent =
        pending;


    // LOWER ACCEPTED

    document.getElementById(
        "acceptedApplications"
    ).textContent =
        accepted;


    // LOWER PENDING

    document.getElementById(
        "pendingApplications"
    ).textContent =
        pending;


    // LOWER REJECTED

    document.getElementById(
        "rejectedApplications"
    ).textContent =
        rejected;


    displayApplicationGraph(
        accepted,
        pending,
        rejected
    );

}


// ==========================================
// APPLICATION BAR GRAPH
// ==========================================

function displayApplicationGraph(
    accepted,
    pending,
    rejected
) {

    const container =
        document.getElementById(
            "jobChart"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    const data = [

        {
            title: "Accepted",
            icon: "✅",
            count: accepted
        },

        {
            title: "Pending",
            icon: "⏳",
            count: pending
        },

        {
            title: "Rejected",
            icon: "❌",
            count: rejected
        }

    ];


    const maxCount =
        Math.max(
            accepted,
            pending,
            rejected,
            1
        );


    data.forEach(
        function(item) {

            const column =
                document.createElement(
                    "div"
                );


            column.className =
                "bar-column";


            // VALUE

            const value =
                document.createElement(
                    "div"
                );


            value.className =
                "bar-value";


            value.textContent =
                item.count;


            // BAR

            const bar =
                document.createElement(
                    "div"
                );


            bar.className =
                "bar";


            const height =
                item.count === 0
                    ? 4
                    : Math.max(
                        (
                            item.count /
                            maxCount
                        ) * 190,
                        15
                    );


            bar.style.height =
                `${height}px`;


            bar.title =
                `${item.title}: ${item.count}`;


            // TITLE

            const title =
                document.createElement(
                    "div"
                );


            title.className =
                "bar-title";


            title.textContent =
                `${item.icon} ${item.title}`;


            // SUBTITLE

            const subtitle =
                document.createElement(
                    "div"
                );


            subtitle.className =
                "bar-company";


            subtitle.textContent =
                "Applications";


            column.appendChild(
                value
            );


            column.appendChild(
                bar
            );


            column.appendChild(
                title
            );


            column.appendChild(
                subtitle
            );


            container.appendChild(
                column
            );

        }
    );

}


// ==========================================
// GET RESUME DATA
// ==========================================

function getResumeData() {

    try {

        const data =
            JSON.parse(
                localStorage.getItem(
                    "resumeData"
                )
            );


        return data || null;

    }
    catch (error) {

        console.error(
            "Resume data error:",
            error
        );

        return null;

    }

}


// ==========================================
// DISPLAY RESUME ANALYTICS
// ==========================================

function displayResumeAnalytics(
    resume
) {

    const atsElement =
        document.getElementById(
            "atsScore"
        );


    if (!resume) {

        atsElement.textContent =
            "0%";


        displayBestJob(
            null
        );


        return;

    }


    // ATS SCORE

    const atsScore =
        Number(
            resume.ats_score
        ) || 0;


    atsElement.textContent =
        `${atsScore}%`;


    // BEST RECOMMENDED JOB

    let recommendations = [];


    if (
        Array.isArray(
            resume.recommendations
        )
    ) {

        recommendations =
            resume.recommendations;

    }


    if (
        recommendations.length === 0
    ) {

        displayBestJob(
            null
        );

        return;

    }


    // Sort highest match first

    const sorted =
        [...recommendations].sort(
            function(a, b) {

                return (
                    getRecommendationScore(b)
                    -
                    getRecommendationScore(a)
                );

            }
        );


    displayBestJob(
        sorted[0]
    );

}


// ==========================================
// GET RECOMMENDATION SCORE
// ==========================================

function getRecommendationScore(
    job
) {

    if (!job) {

        return 0;

    }


    return Number(

        job.match_percentage ??

        job.match_score ??

        job.score ??

        0

    ) || 0;

}


// ==========================================
// DISPLAY BEST JOB
// ==========================================

function displayBestJob(
    job
) {

    const container =
        document.getElementById(
            "topJob"
        );


    if (!container) {

        return;

    }


    if (!job) {

        container.innerHTML = `

            <div class="top-job-card">

                <h3>
                    No recommendation yet
                </h3>

                <p>
                    Upload and analyze your resume
                    to receive job recommendations.
                </p>

            </div>

        `;

        return;

    }


    const title =
        job.title ||
        job.job_title ||
        "Recommended Job";


    const company =
        job.company ||
        job.company_name ||
        "Company not specified";


    const location =
        job.location ||
        "Location not specified";


    const score =
        getRecommendationScore(
            job
        );


    container.innerHTML = `

        <div class="top-job-card">

            <h3>
                ${escapeHTML(title)}
            </h3>

            <p>
                🏢 ${escapeHTML(company)}
            </p>

            <p>
                📍 ${escapeHTML(location)}
            </p>

            <p class="application-count">
                🎯 ${score}% Match
            </p>

        </div>

    `;

}


// ==========================================
// SAFE HTML
// ==========================================

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


// ==========================================
// LOAD ANALYTICS
// ==========================================

async function loadAnalytics() {

    try {

        // APPLICATIONS

        const applications =
            await loadApplications();


        displayApplicationAnalytics(
            applications
        );


        // RESUME

        const resume =
            getResumeData();


        displayResumeAnalytics(
            resume
        );


        console.log(
            "Job seeker analytics:",
            {
                applications:
                    applications,

                resume:
                    resume
            }
        );

    }
    catch (error) {

        console.error(
            "Analytics error:",
            error
        );


        const chart =
            document.getElementById(
                "jobChart"
            );


        if (chart) {

            chart.innerHTML = `

                <p class="loading">

                    ⚠ Unable to load analytics.

                </p>

            `;

        }

    }

}


// ==========================================
// START
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    loadAnalytics
);


// ==========================================
// AUTO REFRESH
// ==========================================

setInterval(
    loadAnalytics,
    10000
);


// ==========================================
// UPDATE IF LOCAL DATA CHANGES
// ==========================================

window.addEventListener(
    "storage",
    function(event) {

        if (
            event.key === "applications" ||
            event.key === "resumeData"
        ) {

            loadAnalytics();

        }

    }
);