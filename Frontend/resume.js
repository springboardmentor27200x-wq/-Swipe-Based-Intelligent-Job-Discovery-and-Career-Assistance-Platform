const API_URL =
    window.SWIPEX_API_URL;
// =====================================================
// ELEMENTS
// =====================================================

const fileInput =
    document.getElementById(
        "resumeFile"
    );


const fileName =
    document.getElementById(
        "fileName"
    );


const uploadSection =
    document.getElementById(
        "uploadSection"
    );


const loadingSection =
    document.getElementById(
        "loadingSection"
    );


const analysisSection =
    document.getElementById(
        "analysisSection"
    );


// =====================================================
// FILE SELECTION
// =====================================================

if (fileInput) {

    fileInput.addEventListener(
        "change",
        function () {

            if (
                fileInput.files &&
                fileInput.files.length > 0
            ) {

                fileName.textContent =
                    fileInput.files[0].name;

            }
            else {

                fileName.textContent =
                    "No file selected";

            }

        }
    );

}


// =====================================================
// GET USERNAME
// =====================================================

function getUsername() {

    return (
        localStorage.getItem(
            "swipex_username"
        ) ||

        localStorage.getItem(
            "username"
        ) ||

        "Job Seeker"
    );

}


// =====================================================
// UPLOAD RESUME
// =====================================================

async function uploadResume() {

    if (
        !fileInput ||
        !fileInput.files ||
        fileInput.files.length === 0
    ) {

        alert(
            "Please select a resume."
        );

        return;

    }


    const username =
        getUsername();


    if (
        !username ||
        username === "Job Seeker"
    ) {

        alert(
            "Please login again."
        );

        return;

    }


    const file =
        fileInput.files[0];


    // =================================================
    // FILE TYPE
    // =================================================

    const fileNameLower =
        file.name.toLowerCase();


    const isPDF =
        file.type ===
            "application/pdf" ||

        fileNameLower.endsWith(
            ".pdf"
        );


    if (!isPDF) {

        alert(
            "Please upload a PDF resume."
        );

        return;

    }


    // =================================================
    // FILE SIZE
    // =================================================

    if (
        file.size >
        5 * 1024 * 1024
    ) {

        alert(
            "Please upload a resume smaller than 5 MB."
        );

        return;

    }


    // =================================================
    // SHOW LOADING
    // =================================================

    uploadSection.classList.add(
        "hidden"
    );


    analysisSection.classList.add(
        "hidden"
    );


    loadingSection.classList.remove(
        "hidden"
    );


    // =================================================
    // FORM DATA
    // =================================================

    const formData =
        new FormData();


    formData.append(
        "file",
        file
    );


    try {

        console.log(
            "Uploading resume..."
        );


        const response =
            await fetch(
                `${API_URL}/analyze-resume?username=${encodeURIComponent(username)}`,
                {
                    method: "POST",
                    body: formData
                }
            );


        if (!response.ok) {

            const errorText =
                await response.text();


            throw new Error(
                `Upload failed: ${response.status} ${errorText}`
            );

        }


        const data =
            await response.json();


        console.log(
            "Resume Analysis:",
            data
        );


        // =================================================
        // SAVE ANALYSIS
        // =================================================

        localStorage.setItem(
            "resumeData",
            JSON.stringify(data)
        );


        // =================================================
        // DISPLAY ANALYSIS
        // =================================================

        displayAnalysis(
            data
        );


        // =================================================
        // HIDE LOADING
        // =================================================

        loadingSection.classList.add(
            "hidden"
        );


        analysisSection.classList.remove(
            "hidden"
        );


    }
    catch (error) {

        console.error(
            "Resume Upload Error:",
            error
        );


        loadingSection.classList.add(
            "hidden"
        );


        uploadSection.classList.remove(
            "hidden"
        );


        alert(
            "Resume upload failed.\n\n" +
            error.message
        );

    }

}


// =====================================================
// DISPLAY ANALYSIS
// =====================================================

function displayAnalysis(
    data
) {

    console.log(
        "Displaying analysis:",
        data
    );


    // =================================================
    // CANDIDATE DETAILS
    // =================================================

    const filename =
        document.getElementById(
            "analysisFilename"
        );


    const username =
        document.getElementById(
            "analysisUsername"
        );


    if (filename) {

        filename.textContent =
            data.filename ||
            data.file_name ||
            "Resume";

    }


    if (username) {

        username.textContent =
            getUsername();

    }


    // =================================================
    // RESUME SKILLS
    // =================================================

    displayResumeSkills(
        data
    );


    // =================================================
    // ATS SCORE
    // =================================================

    const atsScore =
        Number(
            data.ats_score
        ) || 0;


    const atsElement =
        document.getElementById(
            "atsScore"
        );


    if (atsElement) {

        atsElement.textContent =
            atsScore + "%";

    }


    updateScoreStatus(
        "atsStatus",
        atsScore
    );


    // =================================================
    // MATCH PERCENTAGE
    // =================================================

    const matchPercentage =
        Number(
            data.match_percentage
        ) || 0;


    const matchElement =
        document.getElementById(
            "matchPercentage"
        );


    if (matchElement) {

        matchElement.textContent =
            matchPercentage + "%";

    }


    updateMatchStatus(
        matchPercentage
    );


    // =================================================
    // MATCHED SKILLS
    // =================================================

    displayList(
        "matchedSkills",
        data.matched_skills ||
        data.matchedSkills ||
        []
    );


    // =================================================
    // MISSING SKILLS
    // =================================================

    displayList(
        "missingSkills",
        data.missing_skills ||
        data.missingSkills ||
        []
    );


    // =================================================
    // SUGGESTIONS
    // =================================================

    displayList(
        "suggestions",
        data.suggestions ||
        []
    );


    // =================================================
    // RECOMMENDED JOBS
    // =================================================

    displayRecommendations(
        data.recommendations ||
        []
    );

}


// =====================================================
// DISPLAY RESUME SKILLS
// =====================================================

function displayResumeSkills(
    data
) {

    const container =
        document.getElementById(
            "skillsContainer"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    let skills =
        data.skills ||
        data.resume_skills ||
        data.matched_skills ||
        [];


    if (
        typeof skills ===
        "string"
    ) {

        skills =
            skills
                .split(",")
                .map(
                    skill =>
                        skill.trim()
                )
                .filter(Boolean);

    }


    if (
        !Array.isArray(skills) ||
        skills.length === 0
    ) {

        container.innerHTML = `
            <span class="empty-text">
                No skills detected.
            </span>
        `;

        return;

    }


    skills.forEach(
        function (skill) {

            const tag =
                document.createElement(
                    "span"
                );


            tag.className =
                "skill-tag";


            tag.textContent =
                skill;


            container.appendChild(
                tag
            );

        }
    );

}


// =====================================================
// DISPLAY LIST
// =====================================================

function displayList(
    elementId,
    items
) {

    const list =
        document.getElementById(
            elementId
        );


    if (!list) {

        return;

    }


    list.innerHTML = "";


    if (
        typeof items ===
        "string"
    ) {

        items =
            items
                .split(",")
                .map(
                    item =>
                        item.trim()
                )
                .filter(Boolean);

    }


    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {

        const li =
            document.createElement(
                "li"
            );


        li.textContent =
            "None";


        list.appendChild(
            li
        );


        return;

    }


    items.forEach(
        function (item) {

            const li =
                document.createElement(
                    "li"
                );


            li.textContent =
                item;


            list.appendChild(
                li
            );

        }
    );

}


// =====================================================
// ATS STATUS
// =====================================================

function updateScoreStatus(
    elementId,
    score
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {

        return;

    }


    if (score >= 80) {

        element.textContent =
            "Excellent";

        element.style.color =
            "#16A34A";

    }

    else if (score >= 60) {

        element.textContent =
            "Good";

        element.style.color =
            "#16A34A";

    }

    else if (score >= 40) {

        element.textContent =
            "Needs Improvement";

        element.style.color =
            "#16A34A";

    }

    else {

        element.textContent =
            "Needs Improvement";

        element.style.color =
            "#DC2626";

    }

}


// =====================================================
// MATCH STATUS
// =====================================================

function updateMatchStatus(
    percentage
) {

    const element =
        document.getElementById(
            "matchStatus"
        );


    if (!element) {

        return;

    }


    if (percentage >= 80) {

        element.textContent =
            "Excellent Job Match";

        element.style.color =
            "#16A34A";

    }

    else if (percentage >= 60) {

        element.textContent =
            "Good Job Match";

        element.style.color =
            "#16A34A";

    }

    else {

        element.textContent =
            "More Skills Recommended";

        element.style.color =
            "#DC2626";

    }

}


// =====================================================
// RECOMMENDED JOBS
// =====================================================

function displayRecommendations(
    recommendations
) {

    const container =
        document.getElementById(
            "recommendations"
        );


    if (!container) {

        return;

    }


    container.innerHTML = "";


    if (
        !Array.isArray(
            recommendations
        ) ||
        recommendations.length === 0
    ) {

        container.innerHTML = `
            <p class="empty-text">
                No recommended jobs available.
            </p>
        `;

        return;

    }


    recommendations.forEach(
        function (job) {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "job-card";


            const title =
                job.title ||
                job.job_title ||
                "Recommended Job";


            const company =
                job.company ||
                job.company_name ||
                "Company";


            const location =
                job.location ||
                "Location not specified";


            const match =
                job.match_percentage ??
                job.match ??
                job.score;


            const matchedSkills =
                job.matched_skills ||
                job.matchedSkills ||
                [];


            const missingSkills =
                job.missing_skills ||
                job.missingSkills ||
                [];


            card.innerHTML = `

                <h3>
                    ${escapeHtml(title)}
                </h3>

                <div class="job-company">
                    🏢 ${escapeHtml(company)}
                </div>

                <div class="job-location">
                    📍 ${escapeHtml(location)}
                </div>

                ${
                    match !== undefined
                    ? `
                        <div class="job-match">
                            ⭐ Match: ${escapeHtml(match)}%
                        </div>
                    `
                    : ""
                }

                ${
                    matchedSkills.length > 0
                    ? `
                        <div class="job-skills">
                            ✅ Matched:
                            ${escapeHtml(
                                Array.isArray(matchedSkills)
                                    ? matchedSkills.join(", ")
                                    : matchedSkills
                            )}
                        </div>
                    `
                    : ""
                }

                ${
                    missingSkills.length > 0
                    ? `
                        <div class="job-skills">
                            ❌ Missing:
                            ${escapeHtml(
                                Array.isArray(missingSkills)
                                    ? missingSkills.join(", ")
                                    : missingSkills
                            )}
                        </div>
                    `
                    : ""
                }

            `;


            container.appendChild(
                card
            );

        }
    );

}


// =====================================================
// HTML ESCAPE
// =====================================================

function escapeHtml(
    value
) {

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
// SHOW UPLOAD SECTION
// =====================================================

function showUploadSection() {

    analysisSection.classList.add(
        "hidden"
    );


    loadingSection.classList.add(
        "hidden"
    );


    uploadSection.classList.remove(
        "hidden"
    );


    if (fileInput) {

        fileInput.value = "";

    }


    if (fileName) {

        fileName.textContent =
            "No file selected";

    }

}


// =====================================================
// LOAD PREVIOUS ANALYSIS
// =====================================================

function loadSavedResume() {

    try {

        const savedData =
            JSON.parse(
                localStorage.getItem(
                    "resumeData"
                )
            );


        if (
            savedData &&
            savedData.ats_score !==
            undefined
        ) {

            displayAnalysis(
                savedData
            );


            uploadSection.classList.add(
                "hidden"
            );


            analysisSection.classList.remove(
                "hidden"
            );

        }

    }
    catch (error) {

        console.log(
            "No saved resume analysis found."
        );

    }

}


// =====================================================
// START
// =====================================================

loadSavedResume();