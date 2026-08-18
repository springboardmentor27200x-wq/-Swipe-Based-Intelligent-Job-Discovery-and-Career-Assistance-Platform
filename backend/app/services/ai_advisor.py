import os
import json

def generate_ai_suggestions(job_title: str, matched_keywords: list[str], missing_keywords: list[str], ats_score: int) -> list[str]:
    """
    Generates AI optimization suggestions using Google Gemini / OpenAI API if available,
    or falls back to local intelligent NLP rule engine.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")

    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            
            # Use active Gemini 2.0 / 2.5 Flash model
            model_name = "gemini-2.0-flash"
            model = genai.GenerativeModel(model_name)


            prompt = f"""
            Target Job Title: {job_title}
            ATS Match Score: {ats_score}%
            Matched Keywords: {', '.join(matched_keywords)}
            Missing Keywords: {', '.join(missing_keywords)}

            Provide exactly 3 concise, highly actionable bullet-point suggestions for the candidate to improve their resume ATS score for this role.
            Return a JSON array of strings: ["suggestion 1", "suggestion 2", "suggestion 3"]
            """
            res = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
            suggestions = json.loads(res.text)
            if isinstance(suggestions, list) and len(suggestions) > 0:
                return suggestions[:3]
        except Exception as e:
            print(f"Gemini API call failed, using local NLP advisor fallback: {e}")


    if openai_key:
        try:
            import openai
            client = openai.OpenAI(api_key=openai_key)
            prompt = f"Provide 3 bullet points to optimize a resume for {job_title}. Missing skills: {', '.join(missing_keywords)}."
            res = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}]
            )
            text = res.choices[0].message.content
            lines = [l.strip("-* ").strip() for l in text.split("\n") if l.strip()]
            if lines:
                return lines[:3]
        except Exception as e:
            print(f"OpenAI API call failed, using local NLP advisor fallback: {e}")

    # Fallback Intelligent NLP Rule Engine
    suggestions = []
    
    if missing_keywords:
        top_missing = ", ".join(missing_keywords[:2])
        suggestions.append(f"Highlight hands-on experience or project achievements involving {top_missing}.")
    else:
        suggestions.append(f"Emphasize leadership and senior technical ownership in {job_title} projects.")

    suggestions.append(f"Quantify key achievements on your resume (e.g., 'Improved API response speed by 35% using {matched_keywords[0] if matched_keywords else 'modern tools'}').")

    if "Docker" in missing_keywords or "AWS" in missing_keywords or "Kubernetes" in missing_keywords:
        suggestions.append("Add a dedicated 'Cloud & DevOps' section to showcase containerization and deployment skills.")
    elif "TypeScript" in missing_keywords or "Redux" in missing_keywords:
        suggestions.append("Specify state management and type safety patterns under your technical skill highlights.")
    else:
        suggestions.append("Ensure your resume standardizes tool names to match automated ATS scanner keywords.")

    return suggestions

def generate_cover_letter(candidate_name: str, candidate_skills: list[str], job_title: str, company_name: str, job_description: str) -> str:
    """
    Generates a personalized AI cover letter for the job candidate with dynamic variations.
    """
    import random
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-2.0-flash")

            prompt = f"""
            Write a compelling, professional cover letter from {candidate_name} applying for the {job_title} role at {company_name}.
            Candidate Skills: {', '.join(candidate_skills or ['Fullstack Development', 'Problem Solving'])}
            Job Description: {job_description or ''}
            
            Style Variation Seed: {random.randint(1, 10000)}
            Keep it polished, engaging, 3 paragraphs long, and ready to send.
            """
            res = model.generate_content(prompt, generation_config={"temperature": 0.9})
            if res.text:
                return res.text.strip()
        except Exception as e:
            print(f"Gemini cover letter error fallback: {e}")

    # Fallback cover letter generator with dynamic variations on regenerate
    skills_str = ", ".join(candidate_skills[:4]) if candidate_skills else "software engineering and problem solving"
    
    intros = [
        f"I am writing to express my strong interest in the {job_title} role at {company_name}.",
        f"I was thrilled to see the opening for the {job_title} position at {company_name} and am excited to submit my application.",
        f"With a proven background in technology and a passion for scalable systems, I am eager to apply for the {job_title} role at {company_name}."
    ]
    
    bodies = [
        f"My technical toolkit includes hands-on experience with {skills_str}. Throughout my projects, I have consistently focused on building performant backend services, responsive user interfaces, and clean, maintainable code architectures.",
        f"Leveraging skills across {skills_str}, I have built end-to-end applications, optimized API response latencies, and collaborated effectively across development teams to deliver user-centric software solutions.",
        f"With expertise spanning {skills_str}, I bring strong problem-solving capabilities, database design skills, and a commitment to software engineering best practices that directly align with {company_name}'s goals."
    ]
    
    closings = [
        f"I welcome the opportunity to discuss how my background and technical enthusiasm align with your engineering roadmap. Thank you for your time and consideration.",
        f"I would love to connect and share more about how my experience with {skills_str} can support {company_name}'s upcoming initiatives. Thank you for evaluating my application.",
        f"Thank you for considering my application. I look forward to the possibility of contributing to the innovative work being done at {company_name}."
    ]

    selected_intro = random.choice(intros)
    selected_body = random.choice(bodies)
    selected_closing = random.choice(closings)

    return f"""Dear Hiring Manager at {company_name},

{selected_intro}

{selected_body}

{selected_closing}

Sincerely,
{candidate_name}"""

def generate_interview_questions(job_title: str, job_skills: list[str], missing_keywords: list[str]) -> list[dict]:
    """
    Generates 5 technical and behavioral interview preparation questions with dynamic random sampling.
    """
    import random
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-2.0-flash")

            prompt = f"""
            Generate 5 completely unique, creative interview preparation questions for a candidate applying for a {job_title} role.
            Required Tech Stack: {', '.join(job_skills or [])}
            Skill Gaps to Focus On: {', '.join(missing_keywords or [])}
            Randomization Seed: {random.randint(1, 999999)}

            Make sure each question is distinct from standard templates.
            Return a JSON array of objects:
            [
              {{"question": "Question text...", "type": "Technical" | "Behavioral" | "System Design" | "Coding", "hint": "Brief answer tip..."}}
            ]
            """
            res = model.generate_content(prompt, generation_config={"response_mime_type": "application/json", "temperature": 1.0})
            items = json.loads(res.text)
            if isinstance(items, list) and len(items) >= 3:
                return items[:5]
        except Exception as e:
            print(f"Gemini interview prep error fallback: {e}")

    # Fallback Rich Question Bank (20+ questions) grouped by category for guaranteed unique sampling on regenerate
    primary_skill = job_skills[0] if job_skills else "modern web frameworks"
    secondary_skill = job_skills[1] if len(job_skills) > 1 else "database design"
    gap_skill = missing_keywords[0] if missing_keywords else "cloud deployment"

    system_design_pool = [
        {"question": f"How would you architect a high-concurrency API backend using {primary_skill} to handle 50,000 requests/sec?", "type": "System Design", "hint": "Discuss horizontal scaling, Redis caching, database indexing, and asynchronous queue workers."},
        {"question": f"How do you handle real-time state synchronization across distributed servers in web applications?", "type": "System Design", "hint": "Mention WebSockets, Pub/Sub channels (Redis/Kafka), and stateless session management."},
        {"question": f"Design a rate-limiting middleware for {job_title} APIs to prevent DDoS attacks.", "type": "System Design", "hint": "Explain sliding window logs or token bucket algorithms storing IP counts in memory/Redis."},
        {"question": f"How do you design database schema migrations with zero downtime for live production environments?", "type": "System Design", "hint": "Focus on blue-green deployments, backward-compatible column additions, and dual-writing phases."}
    ]

    technical_pool = [
        {"question": f"What strategies do you use to diagnose and fix memory leaks or CPU spikes in {primary_skill} applications?", "type": "Technical", "hint": "Explain heap snapshots, profiling tools, memory leak patterns (closures, unhandled listeners), and event loop monitoring."},
        {"question": f"How do you implement secure authentication and authorization patterns (JWT, OAuth2, RBAC)?", "type": "Technical", "hint": "Highlight short-lived access tokens, HTTP-only refresh cookies, password hashing (bcrypt), and role permissions."},
        {"question": f"Compare relational SQL ({secondary_skill}) vs NoSQL databases for a scalable enterprise platform.", "type": "Technical", "hint": "Discuss ACID compliance, relational joins, document nesting flexibility, and horizontal sharding tradeoffs."},
        {"question": f"How do you optimize slow database queries and ORM overhead in {job_title} projects?", "type": "Technical", "hint": "Mention EXPLAIN ANALYZE, database indexes, avoiding N+1 query problems, and connection pooling."}
    ]

    behavioral_pool = [
        {"question": f"Describe a situation where a major bug hit production right before a critical deadline. How did you resolve it?", "type": "Behavioral", "hint": "Use the STAR method: isolate root cause, issue a hotfix, communicate with stakeholders, and add regression tests."},
        {"question": f"How do you handle disagreement with senior developers or product managers regarding technical architecture?", "type": "Behavioral", "hint": "Emphasize data-driven benchmarks, building a proof of concept (POC), and focusing on user outcome."},
        {"question": f"Tell me about a project where you had to quickly adopt a tool like {gap_skill} without prior experience.", "type": "Behavioral", "hint": "Highlight self-learning strategies, reading official documentation, building prototype sandboxes, and consulting peers."},
        {"question": f"How do you balance writing high-quality clean code with meeting tight product launch deadlines?", "type": "Behavioral", "hint": "Discuss pragmatic trade-offs, refactoring tech debt after initial launch, and keeping core security non-negotiable."}
    ]

    coding_pool = [
        {"question": f"How do you implement robust global error handling and API fallback boundaries in {primary_skill}?", "type": "Coding", "hint": "Explain try/catch wrappers, global error handler middleware, and user-friendly toast alerts."},
        {"question": f"Walk through how you would build an efficient search filter with debouncing and pagination.", "type": "Coding", "hint": "Explain debouncing input events (300ms delay), query string state, and SQL LIMIT/OFFSET or cursor pagination."},
        {"question": f"How do you enforce type safety, data validation, and schema sanitization for user inputs?", "type": "Coding", "hint": "Discuss schema validation libraries (Pydantic / Zod / Joi) and sanitizing HTML against XSS."},
        {"question": f"How do you write unit and integration tests to ensure 80%+ code coverage for critical business logic?", "type": "Coding", "hint": "Mention mocking external APIs/databases, testing edge cases (null inputs, timeouts), and automated CI/CD runners."}
    ]

    # Pick 1 random question from each pool + 1 random wildcard from all pools
    selected = [
        random.choice(system_design_pool),
        random.choice(technical_pool),
        random.choice(behavioral_pool),
        random.choice(coding_pool)
    ]
    
    all_pools = system_design_pool + technical_pool + behavioral_pool + coding_pool
    remaining = [q for q in all_pools if q not in selected]
    selected.append(random.choice(remaining))

    random.shuffle(selected)
    return selected

def generate_salary_recommendation(job_title: str, experience_level: str, job_skills: list[str], salary_min: int = None, salary_max: int = None) -> str:
    """
    Generates dynamic AI salary recommendation and market benchmark insight.
    """
    base_min = salary_min or 90000
    base_max = salary_max or 140000

    exp = (experience_level or '').lower()
    if '5+' in exp or 'senior' in exp or 'lead' in exp:
        rec_min = int(base_min * 1.08)
        rec_max = int(base_max * 1.15)
        percentile = "85th percentile (Senior Level Market Benchmark)"
    elif '3-5' in exp or 'mid' in exp:
        rec_min = int(base_min * 1.03)
        rec_max = int(base_max * 1.08)
        percentile = "70th percentile (Mid-Senior Market Benchmark)"
    else:
        rec_min = base_min
        rec_max = base_max
        percentile = "50th percentile (Competitive Base Benchmark)"

    skills_highlight = ", ".join(job_skills[:3]) if job_skills else "matching skills"
    return f"${rec_min:,} - ${rec_max:,} / yr ({percentile} for {job_title} positions with expertise in {skills_highlight})"
