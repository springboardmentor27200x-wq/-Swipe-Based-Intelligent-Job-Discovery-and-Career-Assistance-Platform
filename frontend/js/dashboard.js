console.log("🔥🔥🔥 SWIPEX MILESTONE 4 DASHBOARD JS LOADED 🔥🔥🔥");

const API_URL = window.API_BASE_URL;
document.addEventListener("DOMContentLoaded", () => {

    // =====================================================
    // EXISTING ELEMENTS
    // =====================================================

    const resultBox =
        document.getElementById("resultBox");

    const resumeFile =
        document.getElementById("resumeFile");

    const uploadResume =
        document.getElementById("uploadResume");

    const resumeStatus =
        document.getElementById("resumeStatus");

    const aiSuggestions =
        document.getElementById("aiSuggestions");

    const checkATS =
        document.getElementById("checkATS");

    const atsScore =
        document.getElementById("atsScore");

    const matchJobs =
        document.getElementById("matchJobs");

    const matchScore =
        document.getElementById("matchScore");

    const savedCount =
        document.getElementById("savedCount");

    const logoutBtn =
        document.getElementById("logoutBtn");


    // =====================================================
    // AUTHENTICATION
    // =====================================================

    function getToken() {

        return localStorage.getItem("token");

    }


    function authHeaders() {

        const token =
            getToken();

        if (!token) {

            return {};

        }

        return {
            "Authorization":
                "Bearer " + token
        };

    }

    // =====================================================
    // VERIFY RESUME FROM BACKEND
    // =====================================================

    async function getValidResume() {

        try {

            const response =
                await fetch(
                    `${API_URL}/api/profile`,
                    {
                        headers:
                            authHeaders()
                    }
                );

            if (!response.ok) {

                return null;

            }

            const data =
                await response.json();

            const user =
                data.user;

            const resume =
                user &&
                user.resume_text
                    ? user.resume_text
                    : null;

            if (!resume) {

                localStorage.removeItem(
                    "resume_text"
                );

                localStorage.removeItem(
                    "ats_score"
                );

                localStorage.removeItem(
                    "match_score"
                );

                localStorage.removeItem(
                    "best_match_score"
                );

                return null;

            }

            localStorage.setItem(
                "resume_text",
                resume
            );

            return resume;

        } catch (error) {

            console.error(
                "Unable to verify resume:",
                error
            );

            return null;

        }

    }


    // =====================================================
    // SAFE NUMBER
    // =====================================================

    function numberValue(value, fallback = 0) {

        const number =
            Number(value);

        return Number.isFinite(number)
            ? number
            : fallback;

    }


    // =====================================================
    // SAFE ARRAY
    // =====================================================

    function arrayValue(value) {

        return Array.isArray(value)
            ? value
            : [];

    }


    // =====================================================
    // LOAD SAVED JOBS
    // =====================================================

    async function loadSavedJobs() {

        try {

            const token =
                getToken();

            if (!token) {

                return [];

            }


            const response =
                await fetch(
                    `${API_URL}/saved-jobs/me`,
                    {
                        headers:
                            authHeaders()
                    }
                );


            if (response.ok) {

                const jobs =
                    await response.json();

                return Array.isArray(jobs)
                    ? jobs
                    : [];

            }

        }
        catch (error) {

            console.warn(
                "⚠️ Backend saved jobs unavailable:",
                error
            );

        }


        // Fallback for old saved data
        return JSON.parse(
            localStorage.getItem("savedJobs")
        ) || [];

    }


    // =====================================================
    // LOAD APPLICATIONS
    // =====================================================

    async function loadMyApplications() {

        try {

            const token =
                getToken();

            if (!token) {

                return [];

            }


            const response =
                await fetch(
                    `${API_URL}/applications/me`,
                    {
                        headers:
                            authHeaders()
                    }
                );


            if (!response.ok) {

                throw new Error(
                    "Unable to load applications"
                );

            }


            const applications =
                await response.json();


            console.log(
                "📩 DASHBOARD APPLICATIONS:",
                applications
            );


            return Array.isArray(applications)
                ? applications
                : [];

        }
        catch (error) {

            console.error(
                "❌ Application analytics error:",
                error
            );

            return [];

        }

    }


    // =====================================================
    // GENERIC ANALYTICS ENDPOINT
    // =====================================================

    async function fetchAnalyticsEndpoint(
        endpoint
    ) {

        try {

            const token =
                getToken();

            if (!token) {

                return null;

            }


            const response =
                await fetch(
                    `${API_URL}${endpoint}`,
                    {
                        headers:
                            authHeaders()
                    }
                );


            if (!response.ok) {

                console.warn(
                    `⚠️ ${endpoint} returned ${response.status}`
                );

                return null;

            }


            return await response.json();

        }
        catch (error) {

            console.warn(
                `⚠️ Analytics endpoint unavailable: ${endpoint}`,
                error
            );

            return null;

        }

    }


    // =====================================================
    // FIND VALUE IN ANALYTICS RESPONSE
    // =====================================================

    function findValue(
        data,
        possibleKeys,
        fallback = 0
    ) {

        if (!data || typeof data !== "object") {

            return fallback;

        }


        for (const key of possibleKeys) {

            if (
                data[key] !== undefined &&
                data[key] !== null
            ) {

                return data[key];

            }

        }


        return fallback;

    }


    // =====================================================
    // LOAD DASHBOARD ANALYTICS
    // =====================================================

    async function loadAnalyticsDashboard() {

        console.log(
            "📊 Loading Milestone 4 analytics..."
        );


        const applications =
            await loadMyApplications();


        const savedJobs =
            await loadSavedJobs();


        // =================================================
        // APPLICATION STATUS COUNTS
        // =================================================

        const applied =
            applications.filter(
                application =>
                    String(
                        application.status || ""
                    ).toLowerCase() ===
                    "applied"
            ).length;


        const shortlisted =
            applications.filter(
                application =>
                    String(
                        application.status || ""
                    ).toLowerCase() ===
                    "shortlisted"
            ).length;


        const rejected =
            applications.filter(
                application =>
                    String(
                        application.status || ""
                    ).toLowerCase() ===
                    "rejected"
            ).length;


        const selected =
            applications.filter(
                application =>
                    String(
                        application.status || ""
                    ).toLowerCase() ===
                    "selected"
            ).length;


        // =================================================
        // BEST MATCH
        // =================================================

        let bestMatch = 0;


        applications.forEach(
            application => {

                const match =
                    numberValue(
                        application.match_percentage
                    );


                if (match > bestMatch) {

                    bestMatch =
                        match;

                }

            }
        );


        // =================================================
        // AVERAGE MATCH
        // =================================================

        const matchValues =
            applications
                .map(
                    application =>
                        numberValue(
                            application.match_percentage
                        )
                )
                .filter(
                    value =>
                        value > 0
                );


        const averageMatch =
            matchValues.length
                ? Math.round(
                    matchValues.reduce(
                        (sum, value) =>
                            sum + value,
                        0
                    ) /
                    matchValues.length
                )
                : 0;


        // =================================================
        // RESUME SCORE
        // =================================================

        let storedATS =
            localStorage.getItem(
                "ats_score"
            );


        if (
            storedATS === null ||
            storedATS === ""
        ) {

            storedATS = 0;

        }


        const resumeScore =
            numberValue(
                storedATS
            );


        // =================================================
        // UPDATE EXISTING SAVED COUNT
        // =================================================

        if (savedCount) {

            savedCount.innerText =
                savedJobs.length;

        }


        // =================================================
        // UPDATE ANALYTICS CARDS
        // =================================================

        updateText(
            "totalApplications",
            applications.length
        );


        updateText(
            "appliedCount",
            applied
        );


        updateText(
            "shortlistedCount",
            shortlisted
        );


        updateText(
            "rejectedCount",
            rejected
        );


        updateText(
            "selectedCount",
            selected
        );


        updateText(
            "bestMatchAnalytics",
            bestMatch + "%"
        );


        updateText(
            "averageMatch",
            averageMatch + "%"
        );


        updateText(
            "resumePerformance",
            resumeScore + "%"
        );


        // =================================================
        // LOAD BACKEND ANALYTICS IF AVAILABLE
        // =================================================

        const backendDashboard =
            await fetchAnalyticsEndpoint(
                "/analytics/dashboard"
            );


        const backendResume =
            await fetchAnalyticsEndpoint(
                "/analytics/resume-performance"
            );


        const backendInsights =
            await fetchAnalyticsEndpoint(
                "/analytics/recommendation-insights"
            );


        // =================================================
        // BACKEND RESUME RANKING
        // =================================================

        if (backendResume) {

            console.log(
                "📄 Resume performance:",
                backendResume
            );


            const score =
                numberValue(
                    findValue(
                        backendResume,
                        [
                            "score",
                            "resume_score",
                            "ats_score",
                            "atsScore"
                        ],
                        resumeScore
                    )
                );


            updateText(
                "resumePerformance",
                score + "%"
            );


            const percentile =
                findValue(
                    backendResume,
                    [
                        "percentile",
                        "ranking_percentile"
                    ],
                    null
                );


            if (
                percentile !== null
            ) {

                updateText(
                    "resumePercentile",
                    percentile + "%"
                );

            }


            const tier =
                findValue(
                    backendResume,
                    [
                        "tier",
                        "rank",
                        "ranking"
                    ],
                    null
                );


            if (tier !== null) {

                updateText(
                    "resumeTier",
                    tier
                );

            }

        }


        // =================================================
        // BACKEND DASHBOARD OVERRIDES
        // =================================================

        if (backendDashboard) {

            console.log(
                "📊 Backend dashboard analytics:",
                backendDashboard
            );


            const total =
                findValue(
                    backendDashboard,
                    [
                        "total_applications",
                        "applications",
                        "application_count"
                    ],
                    applications.length
                );


            updateText(
                "totalApplications",
                total
            );


            const backendBest =
                numberValue(
                    findValue(
                        backendDashboard,
                        [
                            "best_match",
                            "best_match_percentage",
                            "highest_match"
                        ],
                        bestMatch
                    )
                );


            updateText(
                "bestMatchAnalytics",
                backendBest + "%"
            );

        }


        // =================================================
        // RECOMMENDATION INSIGHTS
        // =================================================

        renderRecommendationInsights(
            backendInsights,
            applications
        );


        // =================================================
        // APPLICATION STATUS CHART
        // =================================================

        renderApplicationChart({
            applied,
            shortlisted,
            rejected,
            selected
        });


        // =================================================
        // MATCH PERFORMANCE CHART
        // =================================================

        renderMatchChart(
            applications
        );


        // =================================================
        // RESUME PERFORMANCE SCALE
        // =================================================

        renderResumeScale(
            resumeScore
        );


        // =================================================
        // APPLICATION INSIGHT
        // =================================================

        renderApplicationInsight({
            total:
                applications.length,

            applied,

            shortlisted,

            rejected,

            selected,

            bestMatch,

            averageMatch
        });


        console.log(
            "✅ Milestone 4 analytics loaded"
        );

    }


    // =====================================================
    // UPDATE TEXT HELPER
    // =====================================================

    function updateText(
        id,
        value
    ) {

        const element =
            document.getElementById(id);


        if (element) {

            element.innerText =
                value;

        }

    }


    // =====================================================
    // APPLICATION STATUS CHART
    // =====================================================

    function renderApplicationChart(
        stats
    ) {

        const chart =
            document.getElementById(
                "applicationChart"
            );


        if (!chart) {

            return;

        }


        const values = [

            {
                label: "Applied",
                value: stats.applied
            },

            {
                label: "Shortlisted",
                value: stats.shortlisted
            },

            {
                label: "Rejected",
                value: stats.rejected
            },

            {
                label: "Selected",
                value: stats.selected
            }

        ];


        const max =
            Math.max(
                1,
                ...values.map(
                    item =>
                        item.value
                )
            );


        chart.innerHTML =
            values
                .map(
                    item => {

                        const width =
                            Math.max(
                                item.value
                                    ? 8
                                    : 2,
                                Math.round(
                                    (
                                        item.value /
                                        max
                                    ) * 100
                                )
                            );


                        return `

                            <div class="analytics-bar-row">

                                <div class="analytics-bar-label">

                                    ${item.label}

                                </div>

                                <div class="analytics-bar-track">

                                    <div
                                        class="analytics-bar-fill"
                                        style="width:${width}%"
                                    ></div>

                                </div>

                                <strong>

                                    ${item.value}

                                </strong>

                            </div>

                        `;

                    }
                )
                .join("");

    }


    // =====================================================
    // MATCH PERFORMANCE CHART
    // =====================================================

    function renderMatchChart(
        applications
    ) {

        const chart =
            document.getElementById(
                "matchChart"
            );


        if (!chart) {

            return;

        }


        if (
            !applications.length
        ) {

            chart.innerHTML = `

                <p>
                    No application match data available yet.
                </p>

            `;

            return;

        }


        const recent =
            applications
                .slice()
                .reverse()
                .slice(
                    0,
                    8
                );


        const maxHeight =
            150;


        chart.innerHTML = `

            <div class="match-chart-inner">

                ${
                    recent
                        .map(
                            (application, index) => {

                                const value =
                                    Math.min(
                                        100,
                                        Math.max(
                                            0,
                                            numberValue(
                                                application.match_percentage
                                            )
                                        )
                                    );


                                const height =
                                    Math.max(
                                        5,
                                        (
                                            value /
                                            100
                                        ) *
                                        maxHeight
                                    );


                                return `

                                    <div
                                        class="match-column"
                                        title="${application.job_title || "Application"}: ${value}%"
                                    >

                                        <div
                                            class="match-value"
                                        >
                                            ${value}%
                                        </div>

                                        <div
                                            class="match-bar"
                                            style="height:${height}px"
                                        ></div>

                                        <div
                                            class="match-index"
                                        >
                                            ${index + 1}
                                        </div>

                                    </div>

                                `;

                            }
                        )
                        .join("")
                }

            </div>

        `;

    }


    // =====================================================
    // RESUME PERFORMANCE SCALE
    // =====================================================

    function renderResumeScale(
        score
    ) {

        const scale =
            document.getElementById(
                "resumeScale"
            );


        if (!scale) {

            return;

        }


        const safeScore =
            Math.min(
                100,
                Math.max(
                    0,
                    numberValue(score)
                )
            );


        let label =
            "Needs Improvement";


        if (
            safeScore >= 80
        ) {

            label =
                "Excellent";

        }
        else if (
            safeScore >= 60
        ) {

            label =
                "Good";

        }
        else if (
            safeScore >= 40
        ) {

            label =
                "Average";

        }


        scale.innerHTML = `

            <div class="resume-scale">

                <div
                    class="resume-scale-fill"
                    style="width:${safeScore}%"
                ></div>

            </div>

            <div class="resume-scale-info">

                <strong>
                    ${safeScore}%
                </strong>

                <span>
                    ${label}
                </span>

            </div>

        `;

    }


    // =====================================================
    // RECOMMENDATION INSIGHTS
    // =====================================================

    function renderRecommendationInsights(
        backendInsights,
        applications
    ) {

        const box =
            document.getElementById(
                "recommendationInsights"
            );


        if (!box) {

            return;

        }


        let insights = [];


        if (
            backendInsights
        ) {

            const backendList =
                backendInsights.insights ||
                backendInsights.recommendations ||
                backendInsights.items ||
                [];


            if (
                Array.isArray(
                    backendList
                )
            ) {

                insights =
                    backendList
                        .map(
                            item => {

                                if (
                                    typeof item ===
                                    "string"
                                ) {

                                    return item;

                                }


                                return (
                                    item.message ||
                                    item.insight ||
                                    item.title ||
                                    ""
                                );

                            }
                        )
                        .filter(
                            item =>
                                item
                        );

            }

        }


        // =================================================
        // FALLBACK INSIGHTS
        // =================================================

        if (
            !insights.length
        ) {

            if (
                applications.length === 0
            ) {

                insights.push(
                    "Apply to relevant jobs to start generating recommendation insights."
                );

            }
            else {

                const matches =
                    applications
                        .map(
                            app =>
                                numberValue(
                                    app.match_percentage
                                )
                        )
                        .filter(
                            value =>
                                value > 0
                        );


                if (
                    matches.length
                ) {

                    const best =
                        Math.max(
                            ...matches
                        );


                    if (
                        best >= 80
                    ) {

                        insights.push(
                            "🔥 You have at least one high-match opportunity above 80%."
                        );

                    }
                    else {

                        insights.push(
                            "🎯 Improve your resume skills and keywords to increase job-match scores."
                        );

                    }

                }


                const rejected =
                    applications.filter(
                        app =>
                            String(
                                app.status || ""
                            ).toLowerCase() ===
                            "rejected"
                    ).length;


                if (
                    rejected > 0
                ) {

                    insights.push(
                        "💡 Review rejected applications and strengthen the skills required by those roles."
                    );

                }


                const selected =
                    applications.filter(
                        app =>
                            String(
                                app.status || ""
                            ).toLowerCase() ===
                            "selected"
                    ).length;


                if (
                    selected > 0
                ) {

                    insights.push(
                        "🎉 Congratulations! Your application history contains selected opportunities."
                    );

                }

            }

        }


        box.innerHTML = `

            <ul class="insight-list">

                ${
                    insights
                        .slice(
                            0,
                            6
                        )
                        .map(
                            insight =>
                                `<li>${insight}</li>`
                        )
                        .join("")
                }

            </ul>

        `;

    }


    // =====================================================
    // APPLICATION INSIGHT
    // =====================================================

    function renderApplicationInsight(
        data
    ) {

        const box =
            document.getElementById(
                "applicationInsight"
            );


        if (!box) {

            return;

        }


        if (
            data.total === 0
        ) {

            box.innerHTML = `

                <p>
                    📭 No applications yet.
                    Start applying to jobs to build your analytics.
                </p>

            `;

            return;

        }


        let message = "";


        if (
            data.selected > 0
        ) {

            message =
                `🎉 You have ${data.selected} selected application${data.selected > 1 ? "s" : ""}. Keep going!`;

        }
        else if (
            data.shortlisted > 0
        ) {

            message =
                `🟢 You have ${data.shortlisted} shortlisted application${data.shortlisted > 1 ? "s" : ""}.`;

        }
        else if (
            data.bestMatch >= 80
        ) {

            message =
                `🔥 Your best current job match is ${data.bestMatch}%. Consider prioritizing high-match opportunities.`;

        }
        else {

            message =
                `📈 You have ${data.total} application${data.total > 1 ? "s" : ""}. Keep improving your resume and applying to relevant roles.`;

        }


        box.innerHTML = `

            <p>
                ${message}
            </p>

            <p>
                Average Match:
                <strong>
                    ${data.averageMatch}%
                </strong>
            </p>

        `;

    }


    // =====================================================
    // LOAD DASHBOARD
    // =====================================================

    async function loadDashboard() {

               try {

            const response =
                await fetch(
                    `${API_URL}/api/profile`,
                    {
                        headers:
                            authHeaders()
                    }
                );

            if (response.ok) {

                const data =
                    await response.json();

                const user =
                    data.user;

                const hasResume =
                    !!(
                        user &&
                        (
                            user.resume_text ||
                            user.resume_filename ||
                            user.resume_path
                        )
                    );

                if (resumeStatus) {

                    resumeStatus.innerText =
                        hasResume
                            ? "Uploaded"
                            : "Not Uploaded";

                }

                if (!hasResume) {

                    localStorage.removeItem(
                        "resume_text"
                    );

                    localStorage.removeItem(
                        "ats_score"
                    );

                    localStorage.removeItem(
                        "match_score"
                    );

                    localStorage.removeItem(
                        "best_match_score"
                    );

                }

            }

        } catch (error) {

            console.error(
                "Error loading profile:",
                error
            );

        }

        const savedJobs =
            await loadSavedJobs();


        if (savedCount) {

            savedCount.innerText =
                savedJobs.length;

        }


        await loadAnalyticsDashboard();

    }


    // =====================================================
    // RESUME UPLOAD
    // =====================================================

    if (uploadResume) {

        uploadResume.addEventListener(
            "click",
            async () => {

                console.log(
                    "📄 RESUME UPLOAD STARTED"
                );


                if (
                    !resumeFile ||
                    !resumeFile.files.length
                ) {

                    alert(
                        "Please select your resume first."
                    );

                    return;

                }


                const token =
                    getToken();


                if (!token) {

                    alert(
                        "Your login session has expired. Please login again."
                    );

                    return;

                }


                try {

                    uploadResume.innerText =
                        "Uploading...";


                    const formData =
                        new FormData();


                    formData.append(
                        "file",
                        resumeFile.files[0]
                    );


                    const response =
                        await fetch(
                            `${API_URL}/upload-resume`,
                            {

                                method: "POST",

                                headers:
                                    authHeaders(),

                                body:
                                    formData

                            }
                        );


                    const data =
                        await response.json();


                    console.log(
                        "📥 RESUME RESPONSE:",
                        data
                    );


                    if (!response.ok) {

                        throw new Error(
                            data.detail ||
                            "Resume upload failed"
                        );

                    }


                    if (
                        data.resume_text
                    ) {

                        localStorage.setItem(
                            "resume_text",
                            data.resume_text
                        );

                    }


                    if (
                        data.ats_score !==
                        undefined
                    ) {

                        localStorage.setItem(
                            "ats_score",
                            data.ats_score
                        );

                    }


                    if (resumeStatus) {

                        resumeStatus.innerText =
                            "Uploaded ✅";

                    }


                    if (resultBox) {

                        resultBox.innerHTML = `

                            <h3>
                                📄 Resume Uploaded Successfully
                            </h3>

                            <p>
                                <strong>
                                    ${data.filename || "Resume"}
                                </strong>
                            </p>

                            <p>
                                Your resume is ready for ATS analysis and AI matching.
                            </p>

                            <p>
                                🎯 ATS Score:
                                <strong>
                                    ${data.ats_score ?? "N/A"}%
                                </strong>
                            </p>

                        `;

                    }


                    uploadResume.innerText =
                        "Upload Resume";


                    await loadAnalyticsDashboard();


                    console.log(
                        "✅ RESUME UPLOAD SUCCESS"
                    );

                }
                catch (error) {

                    console.error(
                        "❌ Resume Upload Error:",
                        error
                    );


                    uploadResume.innerText =
                        "Upload Resume";


                    alert(
                        "Resume upload failed: " +
                        error.message
                    );

                }

            }
        );

    }


    // =====================================================
    // ATS SCORE
    // =====================================================

    if (checkATS) {

        checkATS.addEventListener(
            "click",
            async () => {

                const resume =
                    await getValidResume();


                if (!resume) {

                    alert(
                        "Please upload your resume first."
                    );

                    return;

                }


                try {

                    checkATS.innerText =
                        "Checking...";


                    const response =
                        await fetch(
                            `${API_URL}/ats-score`,
                            {

                                method: "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json"

                                },

                                body:
                                    JSON.stringify({
                                        resume_text:
                                            resume
                                    })

                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            data.detail ||
                            "ATS failed"
                        );

                    }


                    const score =
                        numberValue(
                            data["ATS Score"]
                        );


                    localStorage.setItem(
                        "ats_score",
                        score
                    );


                    if (atsScore) {

                        atsScore.innerText =
                            score + "%";

                    }


                    if (resultBox) {

                        resultBox.innerHTML = `

                            <h3>
                                📊 ATS Analysis
                            </h3>

                            <h2>
                                ${score}%
                            </h2>

                            <h4>
                                ✅ Skills Found
                            </h4>

                            <p>
                                ${
                                    arrayValue(
                                        data["Skills Found"]
                                    ).length
                                        ? arrayValue(
                                            data["Skills Found"]
                                        ).join(", ")
                                        : "None"
                                }
                            </p>

                            <h4>
                                ❌ Missing Skills
                            </h4>

                            <p>
                                ${
                                    arrayValue(
                                        data["Missing Skills"]
                                    ).length
                                        ? arrayValue(
                                            data["Missing Skills"]
                                        ).join(", ")
                                        : "None"
                                }
                            </p>

                        `;

                    }


                    renderResumeScale(
                        score
                    );


                    checkATS.innerText =
                        "Check ATS";


                }
                catch (error) {

                    console.error(
                        "ATS Error:",
                        error
                    );


                    checkATS.innerText =
                        "Check ATS";


                    alert(
                        "Unable to check ATS score."
                    );

                }

            }
        );

    }


    // =====================================================
    // AI SUGGESTIONS
    // =====================================================

    if (aiSuggestions) {

        aiSuggestions.addEventListener(
            "click",
            async () => {

                const resume = await getValidResume();


                if (!resume) {

                    alert(
                        "Please upload your resume first."
                    );

                    return;

                }


                try {

                    aiSuggestions.innerText =
                        "Analyzing...";


                    const response =
                        await fetch(
                            `${API_URL}/ai-suggestions`,
                            {

                                method: "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json"

                                },

                                body:
                                    JSON.stringify({
                                        resume_text:
                                            resume
                                    })

                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            data.detail ||
                            "AI Suggestions failed"
                        );

                    }


                    if (resultBox) {

                        resultBox.innerHTML = `

                            <h3>
                                🤖 AI Resume Suggestions
                            </h3>

                            <ul>

                                ${
                                    arrayValue(
                                        data.suggestions
                                    )
                                        .map(
                                            suggestion =>
                                                `<li>${suggestion}</li>`
                                        )
                                        .join("")
                                }

                            </ul>

                        `;

                    }


                    aiSuggestions.innerText =
                        "Analyze Resume";


                }
                catch (error) {

                    console.error(
                        "AI Suggestions Error:",
                        error
                    );


                    aiSuggestions.innerText =
                        "Analyze Resume";


                    alert(
                        "Unable to get AI suggestions."
                    );

                }

            }
        );

    }


    // =====================================================
    // AI JOB MATCH
    // =====================================================

    if (matchJobs) {

        matchJobs.addEventListener(
            "click",
            async () => {

                const resume = await getValidResume();


                if (!resume) {

                    alert(
                        "Please upload your resume first."
                    );

                    return;

                }


                try {

                    matchJobs.innerText =
                        "Finding Jobs...";


                    const response =
                        await fetch(
                            `${API_URL}/match-job`,
                            {

                                method: "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json"

                                },

                                body:
                                    JSON.stringify({
                                        resume_text:
                                            resume
                                    })

                            }
                        );


                    const data =
                        await response.json();


                    if (!response.ok) {

                        throw new Error(
                            data.detail ||
                            "AI Match failed"
                        );

                    }


                    const recommendations =
                        data.recommendations ||
                        [];


                    if (
                        !recommendations.length
                    ) {

                        if (resultBox) {

                            resultBox.innerHTML = `

                                <h3>
                                    🎯 AI Job Match
                                </h3>

                                <p>
                                    No matching jobs found.
                                </p>

                            `;

                        }


                        matchJobs.innerText =
                            "Find Jobs";

                        return;

                    }


                    const bestMatch =
                        recommendations[0];


                    const bestScore =
                        numberValue(
                            bestMatch.match_percentage
                        );


                    if (matchScore) {

                        matchScore.innerText =
                            bestScore + "%";

                    }


                    // Save best score for analytics
                    localStorage.setItem(
                        "best_match_score",
                        bestScore
                    );


                    if (resultBox) {

                        resultBox.innerHTML = `

                            <h3>
                                🎯 AI Job Recommendations
                            </h3>

                            <p>
                                Found
                                <strong>
                                    ${data.total_jobs || recommendations.length}
                                </strong>
                                jobs.
                            </p>

                            ${
                                recommendations
                                    .map(
                                        (job, index) => `

                                            <div
                                                style="
                                                    margin:15px 0;
                                                    padding:18px;
                                                    border-radius:12px;
                                                    background:#1e293b;
                                                "
                                            >

                                                <h3>
                                                    ${index + 1}.
                                                    ${job.title || "Job"}
                                                </h3>

                                                <p>
                                                    🏢
                                                    <strong>
                                                        ${job.company || "Company"}
                                                    </strong>
                                                </p>

                                                <p>
                                                    📍
                                                    ${job.location || "Not specified"}
                                                </p>

                                                <p>
                                                    💰
                                                    ${job.salary || "Not specified"}
                                                </p>

                                                <p>
                                                    🎯 Match:
                                                    <strong>
                                                        ${numberValue(job.match_percentage)}%
                                                    </strong>
                                                </p>

                                                <p>
                                                    💼
                                                    ${job.skills || "Not specified"}
                                                </p>

                                                <p>
                                                    ✅ Matched Skills:
                                                    ${
                                                        arrayValue(
                                                            job.matched_skills
                                                        ).length
                                                            ? arrayValue(
                                                                job.matched_skills
                                                            ).join(", ")
                                                            : "None"
                                                    }
                                                </p>

                                            </div>

                                        `
                                    )
                                    .join("")
                            }

                        `;

                    }


                    await loadAnalyticsDashboard();


                    matchJobs.innerText =
                        "Find Jobs";


                }
                catch (error) {

                    console.error(
                        "AI Match Error:",
                        error
                    );


                    matchJobs.innerText =
                        "Find Jobs";


                    alert(
                        "Unable to find matching jobs."
                    );

                }

            }
        );

    }


    // =====================================================
    // LOGOUT
    // =====================================================

    if (logoutBtn) {

        logoutBtn.addEventListener(
            "click",
            event => {

                event.preventDefault();

                localStorage.clear();

                window.location.href =
                    "/login";

            }
        );

    }


    // =====================================================
    // INITIAL LOAD
    // =====================================================

    loadDashboard();

});
