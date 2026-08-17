// =====================================================
// SWIPEX AI RESUME ANALYSIS
// =====================================================


// =====================================================
// LOAD RESUME DATA
// =====================================================

function getResumeData() {

    try {

        return (
            JSON.parse(
                localStorage.getItem("resumeData")
            ) || {}
        );

    }

    catch (error) {

        console.error(
            "Resume data error:",
            error
        );

        return {};

    }

}


// =====================================================
// SAFE VALUE
// =====================================================

function safeValue(value) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }

    return String(value);

}


// =====================================================
// DISPLAY ATS SCORE
// =====================================================

function displayATSScore(data) {

    const score =
        Number(
            data.ats_score ??
            data.ATS_Score ??
            data["ATS Score"] ??
            0
        );


    const safeScore =
        Math.max(
            0,
            Math.min(
                100,
                score
            )
        );


    const scoreElement =
        document.getElementById(
            "atsScore"
        );


    if (scoreElement) {

        scoreElement.textContent =
            safeScore + "%";

    }


    const circle =
        document.getElementById(
            "atsCircle"
        );


    if (circle) {

        const degrees =
            safeScore * 3.6;


        circle.style.background =
            `conic-gradient(
                #3B82F6 0deg,
                #7C3AED ${degrees}deg,
                #202A46 ${degrees}deg,
                #202A46 360deg
            )`;

    }


    const title =
        document.getElementById(
            "atsTitle"
        );


    const description =
        document.getElementById(
            "atsDescription"
        );


    if (safeScore >= 80) {

        title.textContent =
            "Excellent Resume";


        description.textContent =
            "Your resume has strong ATS compatibility and is well optimized for automated screening.";

    }

    else if (safeScore >= 60) {

        title.textContent =
            "Good Resume";


        description.textContent =
            "Your resume has good ATS compatibility, with some areas that can still be improved.";

    }

    else if (safeScore >= 40) {

        title.textContent =
            "Needs Improvement";


        description.textContent =
            "Your resume has moderate ATS compatibility. Improving keywords and structure can help.";

    }

    else {

        title.textContent =
            "Needs Optimization";


        description.textContent =
            "Your resume could benefit from stronger keywords, formatting, and job-specific content.";

    }

}


// =====================================================
// DISPLAY MATCH PERCENTAGE
// =====================================================

function displayMatchPercentage(data) {

    const match =
        Number(
            data.match_percentage ??
            data.matchPercentage ??
            data["Match Percentage"] ??
            0
        );


    const safeMatch =
        Math.max(
            0,
            Math.min(
                100,
                match
            )
        );


    const element =
        document.getElementById(
            "matchPercentage"
        );


    if (element) {

        element.textContent =
            safeMatch + "%";

    }


    const progress =
        document.getElementById(
            "matchProgress"
        );


    if (progress) {

        setTimeout(
            function () {

                progress.style.width =
                    safeMatch + "%";

            },
            100
        );

    }

}


// =====================================================
// DISPLAY RESUME FILE NAME
// =====================================================

function displayFileName(data) {

    const element =
        document.getElementById(
            "resumeFileName"
        );


    if (!element) {

        return;

    }


    const filename =
        data.filename ||
        data.file_name ||
        data.resume_filename ||
        "Resume";


    element.textContent =
        filename;

}


// =====================================================
// NORMALIZE ARRAY
// =====================================================

function normalizeArray(value) {

    if (Array.isArray(value)) {

        return value;

    }


    if (
        typeof value === "string" &&
        value.trim() !== ""
    ) {

        return value
            .split(",")
            .map(
                function (item) {

                    return item.trim();

                }
            )
            .filter(Boolean);

    }


    return [];

}


// =====================================================
// DISPLAY MATCHED SKILLS
// =====================================================

function displayMatchedSkills(data) {

    const container =
        document.getElementById(
            "matchedSkills"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    const skills =
        normalizeArray(
            data.matched_skills ??
            data.matchedSkills ??
            data.Skills ??
            data.skills
        );


    if (skills.length === 0) {

        container.innerHTML =
            `<span class="no-data">
                No matched skills detected.
            </span>`;

        return;

    }


    skills.forEach(
        function (skill) {

            const element =
                document.createElement(
                    "span"
                );


            element.className =
                "skill";


            element.textContent =
                skill;


            container.appendChild(
                element
            );

        }
    );

}


// =====================================================
// DISPLAY MISSING SKILLS
// =====================================================

function displayMissingSkills(data) {

    const container =
        document.getElementById(
            "missingSkills"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    const skills =
        normalizeArray(
            data.missing_skills ??
            data.missingSkills ??
            data["Missing Skills"]
        );


    if (skills.length === 0) {

        container.innerHTML =
            `<span class="no-data">
                🎉 No major missing skills detected.
            </span>`;

        return;

    }


    skills.forEach(
        function (skill) {

            const element =
                document.createElement(
                    "span"
                );


            element.className =
                "skill missing";


            element.textContent =
                skill;


            container.appendChild(
                element
            );

        }
    );

}


// =====================================================
// DISPLAY SUGGESTIONS
// =====================================================

function displaySuggestions(data) {

    const container =
        document.getElementById(
            "suggestions"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    const suggestions =
        normalizeArray(
            data.suggestions ??
            data.Suggestions
        );


    if (suggestions.length === 0) {

        container.innerHTML =
            `<div class="no-data">
                No additional suggestions available.
            </div>`;

        return;

    }


    suggestions.forEach(
        function (suggestion) {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "suggestion";


            item.innerHTML = `

                <span class="suggestion-icon">
                    💡
                </span>

                <span>
                    ${escapeHtml(suggestion)}
                </span>

            `;


            container.appendChild(
                item
            );

        }
    );

}


// =====================================================
// DISPLAY RECOMMENDED JOBS
// =====================================================

function displayRecommendations(data) {

    const container =
        document.getElementById(
            "recommendations"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    let jobs =
        data.recommendations ||
        data.Recommendations ||
        [];


    if (!Array.isArray(jobs)) {

        jobs = [];

    }


    if (jobs.length === 0) {

        container.innerHTML =
            `<div class="no-jobs">
                No recommended jobs available yet.
            </div>`;

        return;

    }


    jobs.forEach(
        function (job) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "job-card";


            const title =
                job.job ||
                job.title ||
                job.job_title ||
                "Recommended Position";


            const company =
                job.company ||
                job.company_name ||
                "Company";


            const location =
                job.location ||
                "Location not specified";


            const match =
                job.match ??
                job.match_percentage ??
                job.matchPercentage ??
                0;


            card.innerHTML = `

                <div class="job-company">
                    🏢 ${escapeHtml(company)}
                </div>

                <h3>
                    ${escapeHtml(title)}
                </h3>

                <div class="job-location">
                    📍 ${escapeHtml(location)}
                </div>

                <span class="job-match">
                    ${escapeHtml(match)}% Match
                </span>

            `;


            container.appendChild(
                card
            );

        }
    );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value == null
            ? ""
            : String(value);


    return div.innerHTML;

}


// =====================================================
// BACK TO RESUME
// =====================================================

function goBackToResume() {

    if (
        window.parent &&
        window.parent !== window &&
        typeof window.parent.loadPage ===
            "function"
    ) {

        window.parent.loadPage(
            "resume.html"
        );

        return;

    }


    window.location.href =
        "resume.html";

}


// =====================================================
// LOAD EVERYTHING
// =====================================================

function loadAnalysis() {

    const data =
        getResumeData();


    console.log(
        "SwipeX Resume Analysis:",
        data
    );


    displayFileName(
        data
    );


    displayATSScore(
        data
    );


    displayMatchPercentage(
        data
    );


    displayMatchedSkills(
        data
    );


    displayMissingSkills(
        data
    );


    displaySuggestions(
        data
    );


    displayRecommendations(
        data
    );

}


// =====================================================
// START
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadAnalysis();

    }
);