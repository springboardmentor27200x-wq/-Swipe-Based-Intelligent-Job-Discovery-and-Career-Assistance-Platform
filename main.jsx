import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const jobs = [
  {id:1, title:"Software Engineer Intern", company:"Microsoft", type:"Internship", location:"Hyderabad", salary:"₹35K–50K/mo", skills:["Python","React","SQL"], level:"Fresher", posted:"2h ago", applicants:38, category:"MNC", remote:true, logo:"M"},
  {id:2, title:"Frontend Developer", company:"Zepto", type:"Full-time", location:"Bengaluru", salary:"₹8–12 LPA", skills:["React","JavaScript","CSS"], level:"Fresher", posted:"5h ago", applicants:72, category:"Startup", remote:true, logo:"Z"},
  {id:3, title:"Data Analyst Intern", company:"Walmart Global Tech", type:"Internship", location:"Bengaluru", salary:"₹30K–45K/mo", skills:["Python","SQL","Excel"], level:"Fresher", posted:"1h ago", applicants:21, category:"MNC", remote:false, logo:"W"},
  {id:4, title:"AI/ML Intern", company:"Agnikul Cosmos", type:"Internship", location:"Chennai", salary:"₹25K–35K/mo", skills:["Python","ML","scikit-learn"], level:"Fresher", posted:"3h ago", applicants:16, category:"Startup", remote:false, logo:"A"},
  {id:5, title:"Backend Developer", company:"Freshworks", type:"Full-time", location:"Chennai", salary:"₹10–16 LPA", skills:["Java","SQL","REST"], level:"Junior", posted:"8h ago", applicants:64, category:"MNC", remote:true, logo:"F"},
  {id:6, title:"Software Developer", company:"Razorpay", type:"Full-time", location:"Bengaluru", salary:"₹12–18 LPA", skills:["Java","React","DSA"], level:"Junior", posted:"1d ago", applicants:91, category:"Startup", remote:true, logo:"R"},
  {id:7, title:"Cloud Engineering Intern", company:"AWS", type:"Internship", location:"Hyderabad", salary:"₹40K–55K/mo", skills:["AWS","Linux","Python"], level:"Fresher", posted:"4h ago", applicants:29, category:"MNC", remote:true, logo:"A"},
  {id:8, title:"Junior Java Developer", company:"TCS", type:"Full-time", location:"Warangal", salary:"₹5–7 LPA", skills:["Java","SQL","Git"], level:"Fresher", posted:"2d ago", applicants:44, category:"MNC", remote:false, logo:"T"}
];

const initialApps = [
  {id:1, job:"Software Engineer Intern", company:"Microsoft", status:"Applied", date:"Aug 18, 2026"},
  {id:2, job:"Data Analyst Intern", company:"Walmart Global Tech", status:"Interview", date:"Aug 16, 2026"},
  {id:3, job:"Frontend Developer", company:"Zepto", status:"Saved", date:"Aug 15, 2026"}
];

const skillPool = ["Python","React","SQL","Java","JavaScript","CSS","ML","scikit-learn","Excel","AWS","Linux","REST","DSA","Git"];

function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function App() {
  const [page, setPage] = useState("Discover");
  const [user, setUser] = useState(load("swipex_user", {name:"Student", role:"Job Seeker"}));
  const [authed, setAuthed] = useState(load("swipex_auth", false));
  const [apps, setApps] = useState(load("swipex_apps", initialApps));
  const [saved, setSaved] = useState(load("swipex_saved", []));
  const [skipped, setSkipped] = useState(load("swipex_skipped", []));
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [category, setCategory] = useState("All");
  const [remote, setRemote] = useState(false);
  const [resume, setResume] = useState("");
  const [resumeResult, setResumeResult] = useState(null);
  const [current, setCurrent] = useState(0);
  const [toast, setToast] = useState("");

  const filtered = useMemo(() => jobs.filter(j =>
    !skipped.includes(j.id) &&
    (type === "All" || j.type === type) &&
    (category === "All" || j.category === category) &&
    (!remote || j.remote) &&
    (query === "" || `${j.title} ${j.company} ${j.location} ${j.skills.join(" ")}`.toLowerCase().includes(query.toLowerCase()))
  ), [query,type,category,remote,skipped]);

  const activeJob = filtered[current % Math.max(filtered.length,1)];

  function persist(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function notify(message) {
    setToast(message);
    setTimeout(() => setToast(""), 2200);
  }

  function swipe(action) {
    if (!activeJob) return;
    if (action === "left") {
      const next = [...skipped, activeJob.id];
      setSkipped(next); persist("swipex_skipped", next);
      notify("Skipped — recommendations updated");
    }
    if (action === "save") {
      const next = saved.includes(activeJob.id) ? saved : [...saved, activeJob.id];
      setSaved(next); persist("swipex_saved", next);
      notify("Job saved to favorites");
    }
    if (action === "right") {
      const next = [...apps, {id:Date.now(), job:activeJob.title, company:activeJob.company, status:"Applied", date:"Aug 19, 2026"}];
      setApps(next); persist("swipex_apps", next);
      notify("Application added to tracker");
    }
    setCurrent(v => v + 1);
  }

  function analyzeResume() {
    const text = resume.trim();
    if (!text) { notify("Paste your resume text first"); return; }
    const lower = text.toLowerCase();
    const found = skillPool.filter(s => lower.includes(s.toLowerCase()));
    const missing = skillPool.filter(s => !found.includes(s));
    const keywordBonus = Math.min(30, Math.round((found.length / skillPool.length) * 30));
    const score = Math.min(96, 58 + keywordBonus);
    setResumeResult({
      score, found, missing: missing.slice(0,6),
      suggestions: [
        found.length < 5 ? "Add more technical skills and project keywords." : "Your technical keyword coverage is strong.",
        lower.includes("project") ? "Good project evidence detected; quantify your project impact." : "Add 2–3 projects with measurable outcomes.",
        lower.includes("intern") ? "Internship-oriented keywords are present." : "Add internship, coursework or practical experience keywords."
      ]
    });
  }

  function login(name, role) {
    const u = {name: name || "Student", role};
    setUser(u); setAuthed(true);
    persist("swipex_user", u); persist("swipex_auth", true);
  }

  if (!authed) return <Login onLogin={login}/>;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">S</span><span>Swipe<span>X</span></span></div>
        <div className="role-pill">{user.role}</div>
        <nav>
          {[
            ["Discover","⌂"],["Applications","✓"],["Resume AI","✦"],["Recommendations","★"],["Analytics","▥"],["Startups","⚡"],["Notifications","◉"],["Profile","●"]
          ].map(([name,icon]) => <button className={page===name?"nav active":"nav"} onClick={()=>setPage(name)} key={name}><span>{icon}</span>{name}</button>)}
        </nav>
        <button className="logout" onClick={()=>{setAuthed(false);persist("swipex_auth",false)}}>↪ Sign out</button>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><div className="eyebrow">CAREER ASSISTANCE PLATFORM</div><h1>{page}</h1></div>
          <div className="top-actions"><span className="status-dot"></span><span>Live opportunities</span><div className="avatar">{user.name[0].toUpperCase()}</div></div>
        </header>

        {page==="Discover" && <Discover query={query} setQuery={setQuery} type={type} setType={setType} category={category} setCategory={setCategory} remote={remote} setRemote={setRemote} activeJob={activeJob} count={filtered.length} swipe={swipe} />}
        {page==="Applications" && <Applications apps={apps} setApps={setApps}/>}
        {page==="Resume AI" && <ResumeAI resume={resume} setResume={setResume} analyze={analyzeResume} result={resumeResult}/>}
        {page==="Recommendations" && <Recommendations saved={saved} apps={apps}/>}
        {page==="Analytics" && <Analytics apps={apps} saved={saved}/>}
        {page==="Startups" && <Startups/>}
        {page==="Notifications" && <Notifications/>}
        {page==="Profile" && <Profile user={user} setUser={setUser} persist={persist} notify={notify}/>}
      </main>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Login({onLogin}) {
  const [name,setName]=useState("");
  const [role,setRole]=useState("Job Seeker");
  return <div className="login-page">
    <div className="login-card">
      <div className="brand big"><span className="brand-mark">S</span><span>Swipe<span>X</span></span></div>
      <p className="eyebrow">INTELLIGENT JOB DISCOVERY</p>
      <h1>Find the right opportunity.<br/><em>One swipe at a time.</em></h1>
      <p className="muted">AI-assisted matching, ATS resume analysis, applications and career analytics in one workspace.</p>
      <label>Your name<input value={name} onChange={e=>setName(e.target.value)} placeholder="Enter your name"/></label>
      <label>Role<select value={role} onChange={e=>setRole(e.target.value)}><option>Job Seeker</option><option>Recruiter</option><option>Admin</option></select></label>
      <button className="primary full" onClick={()=>onLogin(name,role)}>Enter SwipeX →</button>
      <div className="login-features"><span>✦ AI Resume</span><span>↔ Smart Matching</span><span>✓ Application Tracker</span></div>
    </div>
  </div>
}

function Discover({query,setQuery,type,setType,category,setCategory,remote,setRemote,activeJob,count,swipe}) {
  return <section>
    <div className="hero-row">
      <div><h2>Discover your next move.</h2><p className="muted">Swipe through jobs matched to your skills and preferences.</p></div>
      <div className="mini-stat"><b>{count}</b><span>matches</span></div>
    </div>
    <div className="filters">
      <input className="search" placeholder="⌕  Search role, skill or company" value={query} onChange={e=>setQuery(e.target.value)}/>
      <select value={type} onChange={e=>setType(e.target.value)}><option>All</option><option>Internship</option><option>Full-time</option></select>
      <select value={category} onChange={e=>setCategory(e.target.value)}><option>All</option><option>MNC</option><option>Startup</option></select>
      <button className={remote?"filter-on":"filter"} onClick={()=>setRemote(!remote)}>⌁ Remote</button>
    </div>
    <div className="discover-grid">
      <div className="swipe-area">
        {activeJob ? <JobCard job={activeJob}/> : <div className="empty"><div className="empty-icon">✓</div><h3>No more jobs</h3><p>Change your filters or reset skipped jobs in Profile.</p></div>}
        {activeJob && <div className="swipe-buttons"><button className="round danger" onClick={()=>swipe("left")}>×</button><button className="round save" onClick={()=>swipe("save")}>☆</button><button className="round success" onClick={()=>swipe("right")}>✓</button></div>}
        <div className="swipe-help"><span>← Skip</span><span>☆ Save</span><span>Apply →</span></div>
      </div>
      <div className="side-panel">
        <div className="panel-title">Smart match</div>
        <div className="match-score">92<span>%</span></div>
        <p>Strong match based on skills, experience level and recent swipe behavior.</p>
        <div className="progress"><i style={{width:"92%"}}></i></div>
        <div className="match-list"><span>✓ Skills match</span><span>✓ Fresher friendly</span><span>✓ Recently posted</span><span>✓ Low competition</span></div>
      </div>
    </div>
  </section>
}

function JobCard({job}) {
  const competition = job.applicants < 35 ? "Low" : job.applicants < 70 ? "Medium" : "High";
  return <div className="job-card">
    <div className="card-top"><div className="company-logo">{job.logo}</div><span className={`competition ${competition.toLowerCase()}`}>{competition} competition</span></div>
    <span className="job-type">{job.type}</span><h2>{job.title}</h2><h3>{job.company}</h3>
    <div className="job-meta"><span>⌖ {job.location}</span><span>◷ {job.posted}</span><span>♧ {job.applicants} applicants</span></div>
    <div className="salary">{job.salary}</div>
    <div className="skills">{job.skills.map(s=><span key={s}>{s}</span>)}</div>
    <div className="card-bottom"><span>{job.remote ? "Remote available" : "On-site"} · {job.level}</span><span className="match">92% match</span></div>
  </div>
}

function Applications({apps,setApps}) {
  const statuses=["Saved","Applied","Interview","Shortlisted","Rejected"];
  const update=(id,status)=>{const next=apps.map(a=>a.id===id?{...a,status}:a);setApps(next);localStorage.setItem("swipex_apps",JSON.stringify(next))};
  return <section><div className="hero-row"><div><h2>Application tracker</h2><p className="muted">Keep every opportunity organized from save to interview.</p></div><div className="mini-stat"><b>{apps.length}</b><span>tracked</span></div></div>
    <div className="stat-grid"><Stat n={apps.length} l="Total applications"/><Stat n={apps.filter(a=>a.status==="Interview").length} l="Interviews"/><Stat n={apps.filter(a=>a.status==="Shortlisted").length} l="Shortlisted"/><Stat n={apps.filter(a=>a.status==="Rejected").length} l="Rejected"/></div>
    <div className="table-card"><div className="table-head"><span>Opportunity</span><span>Status</span><span>Date</span><span>Update</span></div>{apps.map(a=><div className="table-row" key={a.id}><div><b>{a.job}</b><small>{a.company}</small></div><span className={`badge ${a.status.toLowerCase()}`}>{a.status}</span><span>{a.date}</span><select value={a.status} onChange={e=>update(a.id,e.target.value)}>{statuses.map(s=><option key={s}>{s}</option>)}</select></div>)}</div>
  </section>
}
function Stat({n,l}) { return <div className="stat"><b>{n}</b><span>{l}</span></div> }

function ResumeAI({resume,setResume,analyze,result}) {
  return <section><div className="hero-row"><div><h2>AI Resume Analyzer</h2><p className="muted">Check ATS compatibility, keywords and skill gaps before you apply.</p></div><div className="ai-badge">✦ AI POWERED</div></div>
    <div className="resume-grid"><div className="panel-card"><div className="panel-title">Resume content</div><textarea value={resume} onChange={e=>setResume(e.target.value)} placeholder="Paste your resume text here...

Example:
Python, Java, React, SQL
B.Tech Computer Science
Projects: Job recommendation system...
Internship experience..."></textarea><button className="primary" onClick={analyze}>Analyze resume →</button></div>
    <div className="panel-card result-card">{result ? <><div className="score-ring"><b>{result.score}</b><span>/100</span></div><h3>ATS Compatibility Score</h3><p className="muted">Your resume is currently {result.score >= 80 ? "well aligned" : "partially aligned"} with common ATS requirements.</p><div className="result-section"><b>Detected skills</b><div className="skills">{result.found.map(s=><span key={s}>{s}</span>)}</div></div><div className="result-section"><b>Missing keywords</b><div className="skills missing">{result.missing.map(s=><span key={s}>{s}</span>)}</div></div><div className="suggestions">{result.suggestions.map((s,i)=><p key={i}>✦ {s}</p>)}</div></> : <div className="placeholder-ai"><div>✦</div><h3>Ready to analyze</h3><p>Paste your resume and run the analyzer to see ATS score, keywords and recommendations.</p></div>}</div></div>
  </section>
}

function Recommendations({saved,apps}) {
  const recs=jobs.filter(j=>!saved.includes(j.id) && !apps.some(a=>a.job===j.title)).slice(0,4);
  return <section><div className="hero-row"><div><h2>Personalized recommendations</h2><p className="muted">Suggestions based on your skills, profile and swipe behavior.</p></div></div>
    <div className="rec-grid">{recs.map((j,i)=><div className="rec-card" key={j.id}><div className="rec-top"><div className="company-logo small">{j.logo}</div><span>{88-i*4}% match</span></div><h3>{j.title}</h3><p>{j.company} · {j.location}</p><div className="skills">{j.skills.map(s=><span key={s}>{s}</span>)}</div><button className="secondary" onClick={()=>alert(`Open ${j.title} at ${j.company}`)}>View opportunity →</button></div>)}</div>
  </section>
}

function Analytics({apps,saved}) {
  const applied=apps.filter(a=>a.status!=="Saved").length;
  return <section><div className="hero-row"><div><h2>Career analytics</h2><p className="muted">A quick view of your job search performance.</p></div></div>
    <div className="stat-grid"><Stat n={applied} l="Applications"/><Stat n={saved.length} l="Saved jobs"/><Stat n={Math.min(applied,2)} l="Interviews"/><Stat n="92%" l="Avg. match"/></div>
    <div className="analytics-grid"><div className="panel-card"><div className="panel-title">Application pipeline</div><div className="bars">{["Saved","Applied","Interview","Shortlisted","Rejected"].map((s,i)=><div className="bar-row" key={s}><span>{s}</span><div><i style={{width:`${[62,85,34,22,16][i]}%`}}></i></div><b>{[saved.length,applied,2,1,1][i]}</b></div>)}</div></div>
    <div className="panel-card"><div className="panel-title">Career insights</div><div className="insight">✦ <div><b>Strongest area</b><p>Frontend + Python roles have your highest match potential.</p></div></div><div className="insight">⚡ <div><b>Opportunity timing</b><p>Several low-competition jobs were posted in the last 5 hours.</p></div></div><div className="insight">↗ <div><b>Next action</b><p>Improve ATS keywords and apply early to high-match roles.</p></div></div></div></div>
  </section>
}

function Startups() {
  const startups=[["Agnikul Cosmos","Space-tech","Chennai","Hiring interns"],["Zepto","Quick commerce","Bengaluru","Hiring engineers"],["Razorpay","Fintech","Bengaluru","Hiring developers"],["Skyroot Aerospace","Space-tech","Hyderabad","Growing team"]];
  return <section><div className="hero-row"><div><h2>Startup discovery</h2><p className="muted">Explore newer companies and early-career opportunities.</p></div></div><div className="startup-grid">{startups.map(s=><div className="startup" key={s[0]}><div className="company-logo">{s[0][0]}</div><span className="startup-tag">STARTUP</span><h3>{s[0]}</h3><p>{s[1]} · {s[2]}</p><b>{s[3]} →</b></div>)}</div></section>
}

function Notifications() {
  const ns=[["High match opportunity","Software Engineer Intern at Microsoft matches 92% of your profile.","2 min ago"],["Low competition alert","AI/ML Intern at Agnikul Cosmos has only 16 applicants.","18 min ago"],["Resume suggestion","Your ATS score can improve with more project keywords.","1 hour ago"],["Startup hiring","A new startup opportunity is available in Hyderabad.","3 hours ago"]];
  return <section><div className="hero-row"><div><h2>Smart notifications</h2><p className="muted">Personalized alerts for opportunities worth your attention.</p></div></div><div className="notifications">{ns.map((n,i)=><div className="notification" key={i}><div className="notif-icon">{i===0?"★":i===1?"⚡":i===2?"✦":"◉"}</div><div><b>{n[0]}</b><p>{n[1]}</p><small>{n[2]}</small></div><span className="new-dot"></span></div>)}</div></section>
}

function Profile({user,setUser,persist,notify}) {
  const [name,setName]=useState(user.name);
  return <section><div className="hero-row"><div><h2>Profile & settings</h2><p className="muted">Manage your candidate profile and preferences.</p></div></div>
    <div className="profile-grid"><div className="panel-card"><div className="profile-avatar">{name[0]?.toUpperCase()||"S"}</div><label>Display name<input value={name} onChange={e=>setName(e.target.value)}/></label><label>Role<select value={user.role} onChange={e=>setUser({...user,role:e.target.value})}><option>Job Seeker</option><option>Recruiter</option><option>Admin</option></select></label><button className="primary" onClick={()=>{const u={...user,name:name||"Student"};setUser(u);persist("swipex_user",u);notify("Profile saved")}}>Save profile</button></div>
    <div className="panel-card"><div className="panel-title">Profile completeness</div><div className="big-number">78%</div><div className="progress"><i style={{width:"78%"}}></i></div><div className="checklist"><span>✓ Basic profile</span><span>✓ Skills added</span><span>✓ Resume analyzed</span><span>○ Portfolio link</span></div></div></div>
  </section>
}

createRoot(document.getElementById("root")).render(<App />);
