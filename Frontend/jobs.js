const API =
    window.SWIPEX_API_URL;
    
// =====================================================
// GLOBAL VARIABLES
// =====================================================

let jobs = [];
let current = 0;
let isSwiping = false;
let filteredMode = false;


// =====================================================
// SELECTED COMPANY
// =====================================================

const selectedCompany =
    localStorage.getItem("selectedCompany");


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
// GET RESUME DATA
// =====================================================

function getResumeData() {

    try {

        return JSON.parse(
            localStorage.getItem("resumeData")
        ) || {};

    }

    catch (error) {

        console.error(
            "Error reading resumeData:",
            error
        );

        return {};

    }

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
// FIND RECOMMENDATION FOR JOB
// =====================================================

function getRecommendationForJob(job) {

    if (!job) {

        return null;

    }


    const recommendations =
        getRecommendations();


    if (!recommendations.length) {

        return null;

    }


    const jobId =
        String(
            job.id ??
            job.job_id ??
            ""
        );


    const jobCompany =
        normalizeText(
            job.company
        );


    const jobTitle =
        normalizeText(
            job.title
        );


    // =================================================
    // FIRST: MATCH BY JOB ID
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
    // SECOND: MATCH BY COMPANY + JOB TITLE
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
                    recCompany === jobCompany &&
                    recTitle === jobTitle
                );

            }
        );


    if (recommendation) {

        return recommendation;

    }


    // =================================================
    // THIRD: PARTIAL TITLE MATCH
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
                    recCompany === jobCompany &&
                    (
                        recTitle.includes(jobTitle) ||
                        jobTitle.includes(recTitle)
                    )
                );

            }
        );


    return recommendation || null;

}


// =====================================================
// GET JOB-SPECIFIC MATCH PERCENTAGE
// =====================================================

function getJobMatchPercentage(job) {

    if (!job) {

        return 0;

    }


    // =================================================
    // 1. CHECK JOB ITSELF
    // =================================================

    const directMatch =
        job.match ??
        job.match_percentage ??
        job.matchPercentage;


    if (
        directMatch !== undefined &&
        directMatch !== null &&
        directMatch !== ""
    ) {

        const number =
            Number(directMatch);


        if (!isNaN(number)) {

            return Math.round(number);

        }

    }


    // =================================================
    // 2. CHECK RECOMMENDATION
    // =================================================

    const recommendation =
        getRecommendationForJob(job);


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
    // 3. FALLBACK TO RESUME DATA
    // =================================================

    const resumeData =
        getResumeData();


    const resumeMatch =
        resumeData.match_percentage ??
        resumeData.matchPercentage ??
        resumeData.match;


    if (
        resumeMatch !== undefined &&
        resumeMatch !== null &&
        resumeMatch !== ""
    ) {

        const number =
            Number(resumeMatch);


        if (!isNaN(number)) {

            return Math.round(number);

        }

    }


    return 0;

}


// =====================================================
// GET APPLIED JOB IDS
// =====================================================

function getAppliedJobIds() {

    const applications =
        JSON.parse(
            localStorage.getItem("applications")
        ) || [];


    return applications
        .map(
            function (application) {

                return String(
                    application.job_id ??
                    application.id ??
                    ""
                );

            }
        )
        .filter(
            function (id) {

                return id !== "";

            }
        );

}


// =====================================================
// REMOVE APPLIED JOBS
// =====================================================

function removeAppliedJobs(jobList) {

    const appliedJobIds =
        getAppliedJobIds();


    return jobList.filter(
        function (job) {

            if (
                !job ||
                job.id === undefined
            ) {

                return true;

            }


            return !appliedJobIds.includes(
                String(job.id)
            );

        }
    );

}


// =====================================================
// LOAD JOBS
// =====================================================

async function loadJobs() {

    try {

        const response =
            await fetch(
                `${API}/jobs`
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load jobs"
            );

        }


        const data =
            await response.json();


        const fetchedJobs =
            Array.isArray(data)
                ? data
                : [];


        // =================================================
        // STORE COMPLETE JOB LIST
        // =================================================

        localStorage.setItem(
            "allJobs",
            JSON.stringify(fetchedJobs)
        );


        // =================================================
        // REMOVE APPLIED JOBS
        // =================================================

        jobs =
            removeAppliedJobs(
                fetchedJobs
            );


        // =================================================
        // COMPANY FILTER
        // =================================================

        if (selectedCompany) {

            jobs =
                jobs.filter(
                    function (job) {

                        return (
                            job.company ===
                            selectedCompany
                        );

                    }
                );


            localStorage.removeItem(
                "selectedCompany"
            );

        }


        current = 0;


        // =================================================
        // NO JOBS
        // =================================================

        if (jobs.length === 0) {

            showNoJobs();

            return;

        }


        showJob();

    }

    catch (error) {

        console.error(
            "Error loading jobs:",
            error
        );


        const company =
            document.getElementById(
                "company"
            );


        const title =
            document.getElementById(
                "title"
            );


        if (company) {

            company.textContent =
                "Unable to load jobs";

        }


        if (title) {

            title.textContent =
                "Backend connection failed";

        }

    }

}


// =====================================================
// SHOW CURRENT JOB
// =====================================================

function showJob() {

    if (
        current >= jobs.length
    ) {

        showNoMoreJobs();

        return;

    }


    const job =
        jobs[current];


    console.log(
        "Showing job:",
        current + 1,
        "of",
        jobs.length,
        job
    );


    const company =
        document.getElementById(
            "company"
        );


    const title =
        document.getElementById(
            "title"
        );


    const location =
        document.getElementById(
            "location"
        );


    const experience =
        document.getElementById(
            "experience"
        );


    const salary =
        document.getElementById(
            "salary"
        );


    const description =
        document.getElementById(
            "description"
        );


    if (company) {

        company.textContent =
            job.company ||
            "Unknown Company";

    }


    if (title) {

        title.textContent =
            job.title ||
            "Job";

    }


    if (location) {

        location.textContent =
            "📍 " +
            (
                job.location ||
                "Not specified"
            );

    }


    if (experience) {

        experience.textContent =
            job.experience ||
            "Experience not specified";

    }


    if (salary) {

        salary.textContent =
            job.salary ||
            "Not specified";

    }


    if (description) {

        description.textContent =
            job.description ||
            "No description available.";

    }


    // =================================================
    // COMPANY LOGO
    // =================================================

    const logo =
        document.querySelector(".logo");


    if (logo) {

        logo.textContent =
            (
                job.company ||
                "S"
            )
            .charAt(0)
            .toUpperCase();

    }


    // =================================================
    // SKILLS
    // =================================================

    showJobSkills(job);


    // =================================================
    // RESUME COMPATIBILITY
    // =================================================

    showResumeCompatibility(job);


    // =================================================
    // JOB INDICATORS
    // =================================================

    showJobIndicators(job);


    // =================================================
    // RESET CARD
    // =================================================

    const card =
        document.getElementById(
            "jobCard"
        );


    if (card) {

        card.classList.remove(
            "swipe-left",
            "swipe-right"
        );


        card.style.transform =
            "";


        card.style.opacity =
            "1";

    }

}


// =====================================================
// SHOW NO JOBS
// =====================================================

function showNoJobs() {

    setText(
        "company",
        "No Jobs Found"
    );


    setText(
        "title",
        "Try different filters"
    );


    setText(
        "location",
        ""
    );


    setText(
        "experience",
        ""
    );


    setText(
        "salary",
        ""
    );


    setText(
        "description",
        "No jobs match your search."
    );


    clearJobExtraInformation();

}


// =====================================================
// SHOW NO MORE JOBS
// =====================================================

function showNoMoreJobs() {

    console.log(
        "All jobs completed."
    );


    setText(
        "company",
        "🎉 All Done!"
    );


    setText(
        "title",
        "No More Jobs"
    );


    setText(
        "location",
        ""
    );


    setText(
        "experience",
        ""
    );


    setText(
        "salary",
        ""
    );


    setText(
        "description",
        "You have viewed all available jobs."
    );


    clearJobExtraInformation();

}


// =====================================================
// SET TEXT HELPER
// =====================================================

function setText(id, value) {

    const element =
        document.getElementById(id);


    if (element) {

        element.textContent =
            value;

    }

}


// =====================================================
// CLEAR EXTRA JOB INFORMATION
// =====================================================

function clearJobExtraInformation() {

    const skills =
        document.querySelector(
            ".skills"
        );


    if (skills) {

        skills.innerHTML =
            "";

    }


    setText(
        "compatibility",
        ""
    );


    setText(
        "matchedSkills",
        ""
    );


    setText(
        "missingSkills",
        ""
    );


    setText(
        "applicantCount",
        ""
    );


    setText(
        "competition",
        ""
    );


    setText(
        "earlyApplicant",
        ""
    );


    setText(
        "recentlyPosted",
        ""
    );

}


// =====================================================
// JOB SKILLS
// =====================================================

function showJobSkills(job) {

    const skillsDiv =
        document.querySelector(
            ".skills"
        );


    if (!skillsDiv) {

        return;

    }


    skillsDiv.innerHTML =
        "";


    const commonSkills = [

        "python",
        "java",
        "c",
        "c++",
        "sql",
        "mysql",
        "postgresql",
        "react",
        "html",
        "css",
        "javascript",
        "fastapi",
        "django",
        "flask",
        "docker",
        "git",
        "github",
        "machine learning",
        "artificial intelligence",
        "ai",
        "nlp",
        "data science",
        "power bi",
        "excel",
        "aws",
        "azure"

    ];


    let skills = [];


    if (Array.isArray(job.skills)) {

        skills =
            job.skills;

    }

    else if (
        typeof job.skills === "string"
    ) {

        skills =
            job.skills
                .split(",")
                .map(
                    function (skill) {

                        return skill.trim();

                    }
                )
                .filter(Boolean);

    }


    if (skills.length === 0) {

        skills =
            commonSkills.filter(
                function (skill) {

                    return (
                        (
                            job.title ||
                            ""
                        ) +
                        " " +
                        (
                            job.description ||
                            ""
                        )
                    )
                    .toLowerCase()
                    .includes(skill);

                }
            );

    }


    skills =
        [...new Set(skills)];


    skills
        .slice(0, 8)
        .forEach(
            function (skill) {

                const span =
                    document.createElement(
                        "span"
                    );


                span.textContent =
                    skill;


                skillsDiv.appendChild(
                    span
                );

            }
        );

}


// =====================================================
// RESUME COMPATIBILITY
// =====================================================

function showResumeCompatibility(job) {

    const compatibility =
        document.getElementById(
            "compatibility"
        );


    const matchedSkills =
        document.getElementById(
            "matchedSkills"
        );


    const missingSkills =
        document.getElementById(
            "missingSkills"
        );


    if (!compatibility) {

        return;

    }


    const resumeData =
        getResumeData();


    // =================================================
    // NO RESUME
    // =================================================

    if (
        !resumeData ||
        Object.keys(resumeData).length === 0
    ) {

        compatibility.textContent =
            "Upload Resume";


        if (matchedSkills) {

            matchedSkills.textContent =
                "";

        }


        if (missingSkills) {

            missingSkills.textContent =
                "";

        }


        return;

    }


    // =================================================
    // FIND JOB-SPECIFIC RECOMMENDATION
    // =================================================

    const recommendation =
        getRecommendationForJob(job);


    let matchPercentage =
        getJobMatchPercentage(job);


    // =================================================
    // GET JOB-SPECIFIC SKILLS
    // =================================================

    let matched = [];
    let missing = [];


    if (recommendation) {

        matched =
            recommendation.matched_skills ||
            recommendation.matchedSkills ||
            [];


        missing =
            recommendation.missing_skills ||
            recommendation.missingSkills ||
            [];

    }

    else {

        matched =
            resumeData.matched_skills ||
            resumeData.matchedSkills ||
            [];


        missing =
            resumeData.missing_skills ||
            resumeData.missingSkills ||
            [];

    }


    // =================================================
    // DISPLAY MATCH
    // =================================================

    if (matchPercentage > 0) {

        compatibility.textContent =
            `${matchPercentage}% Match`;

    }

    else {

        compatibility.textContent =
            "0% Match";

    }


    // =================================================
    // DISPLAY MATCHED SKILLS
    // =================================================

    if (matchedSkills) {

        matchedSkills.textContent =
            matched.length
                ? "Matched: " +
                  matched.join(", ")
                : "";

    }


    // =================================================
    // DISPLAY MISSING SKILLS
    // =================================================

    if (missingSkills) {

        missingSkills.textContent =
            missing.length
                ? "Missing: " +
                  missing.join(", ")
                : "";

    }


    console.log(
        "Resume Match:",
        job.title,
        matchPercentage,
        recommendation
    );

}


// =====================================================
// JOB INDICATORS
// =====================================================

function showJobIndicators(job) {

    const applicantCount =
        document.getElementById(
            "applicantCount"
        );


    const competition =
        document.getElementById(
            "competition"
        );


    const earlyApplicant =
        document.getElementById(
            "earlyApplicant"
        );


    const recentlyPosted =
        document.getElementById(
            "recentlyPosted"
        );


    const count =
        Number(
            job.applicant_count ??
            job.applicants ??
            0
        );


    if (applicantCount) {

        applicantCount.textContent =
            `👥 ${count} Applicants`;

    }


    if (competition) {

        if (count < 20) {

            competition.textContent =
                "🟢 Low";

        }

        else if (count < 50) {

            competition.textContent =
                "🟡 Medium";

        }

        else {

            competition.textContent =
                "🔴 High";

        }

    }


    if (earlyApplicant) {

        earlyApplicant.textContent =
            "🚀 Early Applicant";

    }


    if (recentlyPosted) {

        recentlyPosted.textContent =
            "🕒 Recently Posted";

    }

}


// =====================================================
// SWIPE JOB
// =====================================================

async function swipe(action) {

    if (isSwiping) {

        return;

    }


    if (
        current >= jobs.length
    ) {

        return;

    }


    isSwiping = true;


    const job =
        jobs[current];


    const username =
        localStorage.getItem(
            "swipex_username"
        );


    console.log(
        "Swiping:",
        action,
        "Job:",
        job
    );


    // =================================================
    // BACKEND SWIPE
    // =================================================

    try {

        const response =
            await fetch(
                `${API}/swipe`,
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            username:
                                username,

                            job_id:
                                job.id,

                            action:
                                action

                        })

                }
            );


        if (!response.ok) {

            console.error(
                "Swipe API failed:",
                await response.text()
            );

        }

    }

    catch (error) {

        console.error(
            "Swipe error:",
            error
        );

    }


    // =================================================
    // INTERESTED = APPLICATION
    // =================================================

    if (
        action === "Interested"
    ) {

        // =============================================
        // IMPORTANT:
        // GET THE MATCH FOR THIS EXACT JOB
        // =============================================

        const recommendation =
            getRecommendationForJob(job);


        const matchPercentage =
            getJobMatchPercentage(job);


        const matchedSkills =
            recommendation
                ? (
                    recommendation.matched_skills ||
                    recommendation.matchedSkills ||
                    []
                )
                : [];


        const missingSkills =
            recommendation
                ? (
                    recommendation.missing_skills ||
                    recommendation.missingSkills ||
                    []
                )
                : [];


        console.log(
            "Saving application:",
            job.title,
            "Match:",
            matchPercentage,
            "Recommendation:",
            recommendation
        );


        // =============================================
        // CREATE APPLICATION OBJECT
        // =============================================

        const appliedJob = {

            ...job,

            job_id:
                job.id,

            match:
                Number(matchPercentage),

            match_percentage:
                Number(matchPercentage),

            matched_skills:
                matchedSkills,

            missing_skills:
                missingSkills,

            status:
                "Applied",

            appliedAt:
                new Date().toISOString()

        };


        // =============================================
        // SAVE JOB
        // =============================================

        saveJob(
            appliedJob,
            false
        );


        // =============================================
        // GET APPLICATIONS
        // =============================================

        let applications =
            JSON.parse(
                localStorage.getItem(
                    "applications"
                )
            ) || [];


        // =============================================
        // CHECK DUPLICATE
        // =============================================

        const exists =
            applications.some(
                function (item) {

                    return (
                        String(
                            item.job_id ??
                            item.id ??
                            ""
                        ) ===
                        String(job.id)
                    );

                }
            );


        // =============================================
        // SAVE APPLICATION
        // =============================================

        if (!exists) {

            applications.push(
                appliedJob
            );


            localStorage.setItem(
                "applications",
                JSON.stringify(
                    applications
                )
            );

        }


        localStorage.setItem(
            "lastAppliedJob",
            job.title || ""
        );


        // =============================================
        // REMOVE FROM CURRENT JOB LIST
        // =============================================

        jobs =
            jobs.filter(
                function (item) {

                    return (
                        String(item.id) !==
                        String(job.id)
                    );

                }
            );

    }


    // =================================================
    // ANIMATION
    // =================================================

    const card =
        document.getElementById(
            "jobCard"
        );


    if (card) {

        card.classList.remove(
            "swipe-left",
            "swipe-right"
        );


        void card.offsetWidth;


        if (
            action === "Interested"
        ) {

            card.classList.add(
                "swipe-right"
            );

        }

        else {

            card.classList.add(
                "swipe-left"
            );

        }

    }


    // =================================================
    // SHOW NEXT JOB
    // =================================================

    setTimeout(
        function () {

            if (card) {

                card.classList.remove(
                    "swipe-left",
                    "swipe-right"
                );


                card.style.transform =
                    "";


                card.style.opacity =
                    "1";

            }


            // =========================================
            // INTERESTED:
            // CURRENT JOB WAS REMOVED
            // =========================================

            if (
                action !== "Interested"
            ) {

                current++;

            }


            isSwiping =
                false;


            showJob();

        },
        500
    );

}


// =====================================================
// SAVE CURRENT JOB
// =====================================================

function saveCurrentJob() {

    if (
        current >= jobs.length
    ) {

        return;

    }


    saveJob(
        jobs[current]
    );

}


// =====================================================
// SAVE JOB
// =====================================================

function saveJob(
    job,
    showAlert = true
) {

    if (!job) {

        return;

    }


    let savedJobs =
        JSON.parse(
            localStorage.getItem(
                "savedJobs"
            )
        ) || [];


    const exists =
        savedJobs.some(
            function (item) {

                return (
                    String(item.id) ===
                    String(job.id)
                );

            }
        );


    if (exists) {

        if (showAlert) {

            alert(
                "Job already saved!"
            );

        }


        return;

    }


    savedJobs.push(
        job
    );


    localStorage.setItem(
        "savedJobs",
        JSON.stringify(
            savedJobs
        )
    );


    if (showAlert) {

        alert(
            "❤️ Job Saved Successfully!"
        );

    }

}


// =====================================================
// MOUSE SWIPE
// =====================================================

const card =
    document.getElementById(
        "jobCard"
    );


let startX = 0;
let isDragging = false;


if (card) {

    card.addEventListener(
        "mousedown",
        function (e) {

            if (isSwiping) {

                return;

            }


            isDragging =
                true;


            startX =
                e.clientX;

        }
    );


    document.addEventListener(
        "mousemove",
        function (e) {

            if (
                !isDragging ||
                isSwiping
            ) {

                return;

            }


            const move =
                e.clientX -
                startX;


            card.style.transform =
                `translateX(${move}px) rotate(${move / 20}deg)`;

        }
    );


    document.addEventListener(
        "mouseup",
        function (e) {

            if (!isDragging) {

                return;

            }


            isDragging =
                false;


            const diff =
                e.clientX -
                startX;


            card.style.transform =
                "";


            if (diff > 120) {

                swipe(
                    "Interested"
                );

            }

            else if (diff < -120) {

                swipe(
                    "Skip"
                );

            }

        }
    );

}


// =====================================================
// FILTER JOBS
// =====================================================

function applyFilters() {

    const companyInput =
        document.getElementById(
            "companyFilter"
        );


    const locationInput =
        document.getElementById(
            "locationFilter"
        );


    const experienceInput =
        document.getElementById(
            "experienceFilter"
        );


    const company =
        companyInput
            ? companyInput.value
                .trim()
                .toLowerCase()
            : "";


    const location =
        locationInput
            ? locationInput.value
            : "";


    const experience =
        experienceInput
            ? experienceInput.value
            : "";


    const allJobs =
        JSON.parse(
            localStorage.getItem(
                "allJobs"
            )
        ) || [];


    const availableJobs =
        removeAppliedJobs(
            allJobs
        );


    jobs =
        availableJobs.filter(
            function (job) {

                const companyMatch =
                    company === "" ||
                    (
                        job.company ||
                        ""
                    )
                    .toLowerCase()
                    .includes(
                        company
                    );


                const locationMatch =
                    location === "" ||
                    job.location ===
                    location;


                const experienceMatch =
                    experience === "" ||
                    job.experience ===
                    experience;


                return (
                    companyMatch &&
                    locationMatch &&
                    experienceMatch
                );

            }
        );


    current =
        0;


    filteredMode =
        true;


    if (
        jobs.length === 0
    ) {

        showNoJobs();

        return;

    }


    showJob();

}


// =====================================================
// CLEAR FILTERS
// =====================================================

function clearFilters() {

    const companyInput =
        document.getElementById(
            "companyFilter"
        );


    const locationInput =
        document.getElementById(
            "locationFilter"
        );


    const experienceInput =
        document.getElementById(
            "experienceFilter"
        );


    if (companyInput) {

        companyInput.value =
            "";

    }


    if (locationInput) {

        locationInput.value =
            "";

    }


    if (experienceInput) {

        experienceInput.value =
            "";

    }


    const allJobs =
        JSON.parse(
            localStorage.getItem(
                "allJobs"
            )
        ) || [];


    jobs =
        removeAppliedJobs(
            allJobs
        );


    current =
        0;


    filteredMode =
        false;


    if (
        jobs.length === 0
    ) {

        showNoJobs();

        return;

    }


    showJob();

}


// =====================================================
// NAVIGATION TO DASHBOARD
// =====================================================

function goToDashboard() {

    console.log(
        "Dashboard button clicked"
    );


    if (
        window.parent &&
        window.parent !== window
    ) {

        try {

            if (
                typeof window.parent.loadPage ===
                "function"
            ) {

                window.parent.loadPage(
                    "home.html"
                );


                return;

            }

        }

        catch (error) {

            console.log(
                "Direct parent navigation unavailable:",
                error
            );

        }


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

loadJobs();