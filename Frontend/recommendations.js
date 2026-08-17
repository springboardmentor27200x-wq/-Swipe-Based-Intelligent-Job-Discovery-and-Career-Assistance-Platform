const container =
    document.getElementById("recommendations");


let resumeData = null;


try {

    resumeData =
        JSON.parse(
            localStorage.getItem("resumeData")
        );

}

catch(error) {

    console.error(
        "Resume data error:",
        error
    );

}


const headerAtsScore =
    document.getElementById(
        "headerAtsScore"
    );


const compatibilityScore =
    document.getElementById(
        "compatibilityScore"
    );


const compatibilityCircle =
    document.getElementById(
        "compatibilityCircle"
    );


const compatibilityText =
    document.getElementById(
        "compatibilityText"
    );


const roleRequirements =
    document.getElementById(
        "roleRequirements"
    );


const panelMatched =
    document.getElementById(
        "panelMatched"
    );


const panelMissing =
    document.getElementById(
        "panelMissing"
    );



/* ==================================
   COMPATIBILITY
================================== */

function setCompatibility(job) {

    const match =
        Number(job.match) || 0;


    compatibilityScore.textContent =
        match + "%";


    compatibilityCircle.style.background =

        `conic-gradient(
            #22D3EE 0deg,
            #7C3AED ${match * 3.6}deg,
            #252B45 ${match * 3.6}deg
        )`;


    if(match >= 85){

        compatibilityText.textContent =
            "Excellent compatibility";

    }

    else if(match >= 70){

        compatibilityText.textContent =
            "Good compatibility";

    }

    else if(match >= 50){

        compatibilityText.textContent =
            "Average compatibility";

    }

    else{

        compatibilityText.textContent =
            "Low compatibility";

    }


    /* ==================================
       REQUIREMENTS
    ================================== */

    roleRequirements.innerHTML = "";


    const requirements =
        job.missing_skills || [];


    if(requirements.length === 0){

        roleRequirements.innerHTML =
            "<li>No major missing skills 🎉</li>";

    }

    else{

        requirements.forEach(
            function(skill){

                const li =
                    document.createElement(
                        "li"
                    );

                li.textContent =
                    "Develop " + skill;

                roleRequirements.appendChild(
                    li
                );

            }
        );

    }


    /* ==================================
       MATCHED SKILLS
    ================================== */

    panelMatched.innerHTML = "";


    (
        job.matched_skills || []
    ).forEach(
        function(skill){

            const span =
                document.createElement(
                    "span"
                );

            span.textContent =
                skill;

            panelMatched.appendChild(
                span
            );

        }
    );


    /* ==================================
       MISSING SKILLS
    ================================== */

    panelMissing.innerHTML = "";


    (
        job.missing_skills || []
    ).forEach(
        function(skill){

            const span =
                document.createElement(
                    "span"
                );

            span.textContent =
                skill;

            panelMissing.appendChild(
                span
            );

        }
    );

}



/* ==================================
   APPLICATIONS
================================== */

function getApplications() {

    return (
        JSON.parse(
            localStorage.getItem(
                "applications"
            )
        ) || []
    );

}



/* ==================================
   CHECK APPLIED
================================== */

function isApplied(job) {

    const applications =
        getApplications();


    return applications.some(
        function(item){

            return (

                item.id === job.id ||

                (
                    item.title === job.job &&
                    item.company === job.company
                )

            );

        }
    );

}



/* ==================================
   CHECK SAVED
================================== */

function isSaved(job) {

    const saved =
        JSON.parse(
            localStorage.getItem(
                "savedJobs"
            )
        ) || [];


    return saved.some(
        function(item){

            return (

                item.id === job.id ||

                (
                    item.title === job.job &&
                    item.company === job.company
                )

            );

        }
    );

}



/* ==================================
   APPLY JOB
================================== */

function applyJob(job, button) {

    if(isApplied(job)){

        return;

    }


    const applications =
        getApplications();


    const applicationJob = {

        id:
            job.id ||
            (
                "rec-" +
                job.company +
                "-" +
                job.job
            ),

        title:
            job.job,

        company:
            job.company,

        location:
            job.location ||
            "Not specified",

        salary:
            job.salary ||
            "Not specified",

        experience:
            job.experience ||
            "Not specified",

        description:
            job.description ||
            "",

        match:
            job.match,

        matched_skills:
            job.matched_skills ||
            [],

        missing_skills:
            job.missing_skills ||
            [],

        status:
            "Applied"

    };


    applications.push(
        applicationJob
    );


    localStorage.setItem(
        "applications",
        JSON.stringify(
            applications
        )
    );


    localStorage.setItem(
        "lastAppliedJob",
        job.job
    );


    button.textContent =
        "✓ Applied";


    button.classList.add(
        "applied"
    );


    button.disabled = true;


    alert(
        "✅ Application submitted for "
        + job.job
        + " at "
        + job.company
    );

}



/* ==================================
   SAVE JOB
================================== */

function saveJob(job, button) {

    const saved =
        JSON.parse(
            localStorage.getItem(
                "savedJobs"
            )
        ) || [];


    const exists =
        saved.some(
            function(item){

                return (

                    item.id === job.id ||

                    (
                        item.title === job.job &&
                        item.company === job.company
                    )

                );

            }
        );


    if(exists){

        button.textContent =
            "✓ Saved";

        return;

    }


    saved.push({

        id:
            job.id ||
            (
                "saved-" +
                job.company +
                "-" +
                job.job
            ),

        title:
            job.job,

        company:
            job.company,

        location:
            job.location ||
            "Not specified",

        salary:
            job.salary ||
            "Not specified",

        experience:
            job.experience ||
            "Not specified",

        description:
            job.description ||
            "",

        match:
            job.match

    });


    localStorage.setItem(
        "savedJobs",
        JSON.stringify(saved)
    );


    button.textContent =
        "✓ Saved";


    alert(
        "❤️ Job saved successfully!"
    );

}



/* ==================================
   SKIP JOB
================================== */

function skipJob(card) {

    card.style.opacity = "0";

    card.style.transform =
        "translateX(-80px)";


    setTimeout(
        function(){

            card.remove();

        },
        250
    );

}



/* ==================================
   CREATE JOB CARD
================================== */

function createCard(job) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "card";


    const matched =
        job.matched_skills || [];


    const missing =
        job.missing_skills || [];


    const applied =
        isApplied(job);


    const saved =
        isSaved(job);


    const matchedHTML =
        matched.length

        ?

        matched.map(
            function(skill){

                return `
                    <span class="skill">
                        ${skill}
                    </span>
                `;

            }
        ).join("")

        :

        `
            <span class="skill">
                None
            </span>
        `;


    const missingHTML =
        missing.length

        ?

        missing.map(
            function(skill){

                return `
                    <span class="skill missing">
                        ${skill}
                    </span>
                `;

            }
        ).join("")

        :

        `
            <span class="skill">
                None 🎉
            </span>
        `;


    card.innerHTML = `

        <div class="card-top">

            <div>

                <p class="company">
                    🏢 ${job.company}
                </p>

                <h2>
                    ${job.job}
                </h2>

                <p class="location">
                    📍
                    ${job.location || "Not specified"}
                </p>

            </div>


            <div class="match-badge">

                ${job.match}% Match

            </div>

        </div>


        <div class="job-info">

            <div>
                💰
                ${job.salary || "Salary not specified"}
            </div>

            <div>
                👨‍💻
                ${job.experience || "Experience not specified"}
            </div>

        </div>


        <p class="skill-title">
            Matched Skills
        </p>

        <div class="skills">

            ${matchedHTML}

        </div>


        <p class="skill-title">
            Skills To Improve
        </p>

        <div class="skills">

            ${missingHTML}

        </div>


        <div class="actions">

            <button
                class="skip-btn"
                type="button">

                ✕ Skip

            </button>


            <button
                class="save-btn"
                type="button">

                ${
                    saved
                    ? "✓ Saved"
                    : "🔖 Save"
                }

            </button>


            <button
                class="apply-btn
                ${applied ? "applied" : ""}"
                type="button"
                ${applied ? "disabled" : ""}>

                ${
                    applied
                    ? "✓ Applied"
                    : "✓ Apply Now"
                }

            </button>

        </div>

    `;


    /* ==================================
       CARD CLICK
    ================================== */

    card.addEventListener(
        "click",
        function(event){

            if(
                event.target.closest(
                    "button"
                )
            ){

                return;

            }

            setCompatibility(job);

        }
    );


    /* ==================================
       SKIP
    ================================== */

    card.querySelector(
        ".skip-btn"
    ).addEventListener(
        "click",
        function(){

            skipJob(card);

        }
    );


    /* ==================================
       SAVE
    ================================== */

    card.querySelector(
        ".save-btn"
    ).addEventListener(
        "click",
        function(){

            saveJob(
                job,
                this
            );

        }
    );


    /* ==================================
       APPLY
    ================================== */

    card.querySelector(
        ".apply-btn"
    ).addEventListener(
        "click",
        function(){

            applyJob(
                job,
                this
            );

        }
    );


    return card;

}



/* ==================================
   LOAD RECOMMENDATIONS
================================== */

if(!resumeData){

    container.innerHTML = `

        <div class="empty-card">

            <h2>
                📄 Resume Required
            </h2>

            <p>
                Upload your resume first
                to receive AI recommendations.
            </p>

        </div>

    `;

}

else{

    const recommendations =
        resumeData.recommendations || [];


    headerAtsScore.textContent =
        (
            Number(
                resumeData.ats_score
            ) || 0
        )
        + "%";


    if(
        recommendations.length === 0
    ){

        container.innerHTML = `

            <div class="empty-card">

                <h2>
                    No Recommendations
                </h2>

                <p>
                    No suitable jobs were
                    found for your current skills.
                </p>

            </div>

        `;

    }

    else{

        recommendations
            .slice(0, 6)
            .forEach(
                function(job){

                    container.appendChild(
                        createCard(job)
                    );

                }
            );


        setCompatibility(
            recommendations[0]
        );

    }

}



/* ==================================
   BACK
================================== */

function goBack() {

    if(

        window.parent &&

        typeof window.parent.loadPage ===
            "function"

    ){

        window.parent.loadPage(
            "home.html"
        );

    }

    else{

        window.location.href =
            "jobseeker.html";

    }

}