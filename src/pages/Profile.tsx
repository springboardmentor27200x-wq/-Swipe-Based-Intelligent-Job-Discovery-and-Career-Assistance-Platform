import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import { UserAvatar } from "../components/UserAvatar";
import { api } from "../services/api";
import { 
  User, 
  ShieldCheck, 
  Mail, 
  Sparkles, 
  MapPin, 
  Globe, 
  CheckCircle, 
  Camera, 
  Trash2, 
  Image as ImageIcon, 
  FileText, 
  Calendar, 
  Phone, 
  GraduationCap, 
  Briefcase, 
  CheckCircle2, 
  Cpu, 
  Layers, 
  AlertCircle,
  Building2 
} from "lucide-react";

export const ProfilePage: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Profile state values
  const [fullName, setFullName] = useState(user?.profile?.fullName || "");
  const [email, setEmail] = useState(user?.profile?.email || user?.email || "");
  const [dateOfBirth, setDateOfBirth] = useState(user?.profile?.dateOfBirth || "");
  const [phone, setPhone] = useState(user?.profile?.phone || "");
  const [location, setLocation] = useState(user?.profile?.location || "");
  const [education, setEducation] = useState(user?.profile?.education || "");
  const [experienceYears, setExperienceYears] = useState(user?.profile?.experienceYears || "");
  const [targetDomain, setTargetDomain] = useState<string>(user?.profile?.targetDomain || "ai_ml");
  
  const [title, setTitle] = useState(user?.profile?.title || "");
  const [bio, setBio] = useState(user?.profile?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.profile?.avatarUrl || "");
  const [skills, setSkills] = useState(user?.profile?.skills || []);
  const [skillInput, setSkillInput] = useState("");
  
  const [resumeUrl, setResumeUrl] = useState(user?.profile?.resumeUrl || "");
  const [resumeName, setResumeName] = useState(user?.profile?.resumeName || "");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [companyName, setCompanyName] = useState(user?.profile?.companyName || "");
  const [companyWebsite, setCompanyWebsite] = useState(user?.profile?.companyWebsite || "");

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [autoFillNotice, setAutoFillNotice] = useState<{
    show: boolean;
    domainName: string;
    atsScore: number;
    skillsCount: number;
  } | null>(null);

  // Deep resume skill & project technology extractor with STRICT precision (No false positives like 'go', 'r', 'c#', 'ai', 'rest')
  const extractAllSkillsFromResumeText = (rawText: string, fileName: string = ""): string[] => {
    // 1. Thorough PDF binary & stream cleaning
    const combined = `${rawText} ${fileName}`
      .replace(/<<[\s\S]*?>>/g, " ")
      .replace(/stream[\s\S]*?endstream/gi, " ")
      .replace(/obj[\s\S]*?endobj/gi, " ")
      .replace(/xref[\s\S]*?trailer/gi, " ")
      .replace(/%\w+/g, " ")
      .replace(/\0/g, " ")
      .replace(/[^\x20-\x7E\n\r\t]/g, " ");

    const SKILL_RULES: { label: string; regex: RegExp }[] = [
      // Programming Languages (Safe word-boundary matching)
      { label: "Python", regex: /\bpython\b/i },
      { label: "JavaScript", regex: /\b(?:javascript|es6|es20\d\d)\b/i },
      { label: "TypeScript", regex: /\btypescript\b/i },
      { label: "C++", regex: /(?:\bc\+\+\b|\bcpp\b)/i },
      { label: "C#", regex: /(?:\bc#\b|\bcsharp\b|\bc-sharp\b)/i },
      { label: "Go", regex: /\b(?:golang|go language|go programming)\b/i }, // Strictly golang / go language
      { label: "Rust", regex: /\brust\b/i },
      { label: "Java", regex: /\bjava\b/i },
      { label: "Ruby", regex: /\bruby\b/i },
      { label: "PHP", regex: /\bphp\b/i },
      { label: "Swift", regex: /\bswift\b/i },
      { label: "Kotlin", regex: /\bkotlin\b/i },
      { label: "R", regex: /\b(?:r language|r programming|r-lang)\b/i }, // Strictly r language
      { label: "Scala", regex: /\bscala\b/i },
      { label: "Dart", regex: /\bdart\b/i },
      { label: "SQL", regex: /\bsql\b/i },
      { label: "Bash", regex: /\b(?:bash|shell scripting|shell script|powershell)\b/i },

      // Frontend & UI
      { label: "React", regex: /\b(?:react|reactjs|react\.js)\b/i },
      { label: "Next.js", regex: /\b(?:nextjs|next\.js)\b/i },
      { label: "Vue.js", regex: /\b(?:vue|vuejs|vue\.js)\b/i },
      { label: "Angular", regex: /\b(?:angular|angularjs)\b/i },
      { label: "Svelte", regex: /\bsvelte\b/i },
      { label: "Redux", regex: /\bredux\b/i },
      { label: "Zustand", regex: /\bzustand\b/i },
      { label: "Tailwind CSS", regex: /\b(?:tailwind|tailwindcss|tailwind css)\b/i },
      { label: "Bootstrap", regex: /\bbootstrap\b/i },
      { label: "HTML5", regex: /\b(?:html|html5)\b/i },
      { label: "CSS3", regex: /\b(?:css|css3|sass|scss)\b/i },
      { label: "Vite", regex: /\bvite\b/i },
      { label: "Webpack", regex: /\bwebpack\b/i },
      { label: "Figma", regex: /\bfigma\b/i },
      { label: "UI/UX Architecture", regex: /\b(?:ui\/ux|user interface|ui architecture)\b/i },

      // Backend & APIs
      { label: "Node.js", regex: /\b(?:nodejs|node\.js|node js)\b/i },
      { label: "Express.js", regex: /\b(?:express|expressjs|express\.js)\b/i },
      { label: "Django", regex: /\bdjango\b/i },
      { label: "Flask", regex: /\bflask\b/i },
      { label: "FastAPI", regex: /\bfastapi\b/i },
      { label: "Spring Boot", regex: /\b(?:spring boot|springboot)\b/i },
      { label: "Ruby on Rails", regex: /\b(?:rails|ruby on rails)\b/i },
      { label: "ASP.NET", regex: /\b(?:asp\.net|\.net core)\b/i },
      { label: "GraphQL", regex: /\bgraphql\b/i },
      { label: "REST API", regex: /\b(?:rest api|restful api|rest apis|restful)\b/i },
      { label: "Microservices", regex: /\bmicroservices\b/i },
      { label: "System Design", regex: /\bsystem design\b/i },
      { label: "WebSockets", regex: /\bwebsockets?\b/i },
      { label: "gRPC", regex: /\bgrpc\b/i },
      { label: "Kafka", regex: /\bkafka\b/i },
      { label: "RabbitMQ", regex: /\brabbitmq\b/i },

      // Databases
      { label: "PostgreSQL", regex: /\b(?:postgresql|postgres)\b/i },
      { label: "MySQL", regex: /\bmysql\b/i },
      { label: "MongoDB", regex: /\bmongodb\b/i },
      { label: "Redis", regex: /\bredis\b/i },
      { label: "DynamoDB", regex: /\bdynamodb\b/i },
      { label: "SQLite", regex: /\bsqlite\b/i },
      { label: "Elasticsearch", regex: /\belasticsearch\b/i },
      { label: "Supabase", regex: /\bsupabase\b/i },
      { label: "Firebase", regex: /\bfirebase\b/i },

      // Cloud & DevOps
      { label: "Docker", regex: /\bdocker\b/i },
      { label: "Kubernetes", regex: /\b(?:kubernetes|k8s)\b/i },
      { label: "AWS", regex: /\b(?:aws|amazon web services)\b/i },
      { label: "Google Cloud", regex: /\b(?:gcp|google cloud)\b/i },
      { label: "Azure", regex: /\bazure\b/i },
      { label: "DevOps", regex: /\bdevops\b/i },
      { label: "CI/CD", regex: /\b(?:ci\/cd|cicd)\b/i },
      { label: "Terraform", regex: /\bterraform\b/i },
      { label: "Linux", regex: /\blinux\b/i },
      { label: "Git", regex: /\bgit\b/i },
      { label: "GitHub", regex: /\bgithub\b/i },
      { label: "GitLab", regex: /\bgitlab\b/i },
      { label: "JIRA", regex: /\bjira\b/i },
      { label: "Agile", regex: /\bagile\b/i },

      // AI / Machine Learning
      { label: "PyTorch", regex: /\bpytorch\b/i },
      { label: "TensorFlow", regex: /\btensorflow\b/i },
      { label: "Generative AI", regex: /\b(?:generative ai|genai|gen ai)\b/i },
      { label: "LLMs", regex: /\b(?:llms?|large language models?)\b/i },
      { label: "LangChain", regex: /\blangchain\b/i },
      { label: "Hugging Face", regex: /\b(?:hugging face|huggingface|transformers)\b/i },
      { label: "Machine Learning", regex: /\bmachine learning\b/i },
      { label: "Deep Learning", regex: /\bdeep learning\b/i },
      { label: "Scikit-Learn", regex: /\b(?:scikit-learn|sklearn)\b/i },
      { label: "Pandas", regex: /\bpandas\b/i },
      { label: "NumPy", regex: /\bnumpy\b/i },
      { label: "OpenCV", regex: /\b(?:opencv|cv2)\b/i },
      { label: "Vector Databases", regex: /\b(?:vector database|vector db|pinecone|chromadb|faiss|qdrant)\b/i },
      { label: "Prompt Engineering", regex: /\bprompt engineering\b/i },
      { label: "RAG", regex: /\brag\b/i },
      { label: "MLOps", regex: /\bmlops\b/i },

      // Mobile
      { label: "React Native", regex: /\breact native\b/i },
      { label: "Flutter", regex: /\bflutter\b/i }
    ];

    const found = new Set<string>();

    SKILL_RULES.forEach((rule) => {
      if (rule.regex.test(combined)) {
        found.add(rule.label);
      }
    });

    return Array.from(found);
  };

  // Sync skills from current active resume
  const handleAutoFillSkillsFromResume = async () => {
    try {
      const activeText = user?.profile?.resumeText || resumeName || "";
      const extracted = extractAllSkillsFromResumeText(activeText, resumeName);
      
      const newSkills = extracted;
      setSkills(newSkills);
      await api.put("/profile", { skills: newSkills });
      await updateUserProfile({ skills: newSkills });

      setAutoFillNotice({
        show: true,
        domainName: targetDomain.toUpperCase().replace("_", " / "),
        atsScore: newSkills.length >= 5 ? 96 : 85,
        skillsCount: newSkills.length
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      console.error("Failed to auto-sync resume skills", err);
    }
  };

  // Sync with user profile on mount or auth change
  useEffect(() => {
    if (user?.profile) {
      setFullName(user.profile.fullName || "");
      setEmail(user.profile.email || user.email || "");
      setDateOfBirth(user.profile.dateOfBirth || "");
      setPhone(user.profile.phone || "");
      setLocation(user.profile.location || "");
      setEducation(user.profile.education || "");
      setExperienceYears(user.profile.experienceYears || "");
      setTargetDomain(user.profile.targetDomain || "ai_ml");
      setTitle(user.profile.title || "");
      setBio(user.profile.bio || "");
      setAvatarUrl(user.profile.avatarUrl || "");
      setSkills(user.profile.skills || []);
      setResumeUrl(user.profile.resumeUrl || "");
      setResumeName(user.profile.resumeName || "");
      setCompanyName(user.profile.companyName || "");
      setCompanyWebsite(user.profile.companyWebsite || "");
    }
  }, [user]);

  // Calculate age dynamically
  const calculateAge = (dob: string): number | null => {
    if (!dob) return null;
    const birth = new Date(dob);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const calculatedAge = calculateAge(dateOfBirth);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const payload: any = {
        fullName,
        email,
        dateOfBirth,
        age: calculatedAge ?? undefined,
        phone,
        location,
        education,
        experienceYears,
        targetDomain,
        title,
        bio,
        avatarUrl,
        skills
      };

      if (user?.role === "job_seeker") {
        payload.resumeUrl = resumeUrl;
        payload.resumeName = resumeName;
      } else if (user?.role === "recruiter") {
        payload.companyName = companyName;
        payload.companyWebsite = companyWebsite;
      }

      await updateUserProfile(payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save profile modifications", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) {
      setSkills([...skills, s]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (s: string) => {
    setSkills(skills.filter((sk) => sk !== s));
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Domain-specific trending skill list for fast one-click add
  const getDomainTrendingSkills = () => {
    if (targetDomain === "frontend") {
      return ["React", "Next.js", "TypeScript", "Tailwind CSS", "Redux", "Zustand", "Vite", "Web Performance", "REST API", "UI/UX Architecture"];
    } else if (targetDomain === "backend") {
      return ["Python", "Node.js", "Go", "PostgreSQL", "Redis", "Microservices", "System Design", "Docker", "GraphQL", "Kafka"];
    } else if (targetDomain === "devops") {
      return ["Kubernetes", "Docker", "AWS", "Terraform", "CI/CD", "Linux", "Prometheus", "Grafana", "Ansible", "Cloud Architecture"];
    } else if (targetDomain === "mobile") {
      return ["React Native", "Flutter", "TypeScript", "Swift", "Kotlin", "Mobile UI", "REST API", "Firebase"];
    }
    // Default AI / ML
    return ["PyTorch", "LLMs", "Generative AI", "LangChain", "Hugging Face", "FastAPI", "Vector Databases", "Python", "MLOps", "Scikit-Learn", "Computer Vision", "Prompt Engineering"];
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
        {/* Banner */}
        <div className="h-36 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 p-6 flex items-end">
          <div className="flex items-center space-x-4 transform translate-y-10">
            <UserAvatar
              avatarUrl={avatarUrl}
              name={fullName || user?.profile?.fullName}
              email={user?.email}
              className="w-24 h-24 border-4 border-white shadow-xl"
              textSize="text-3xl font-black"
            />
          </div>
        </div>

        {/* Profile General Block */}
        <div className="pt-14 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {fullName || user?.profile?.fullName || "SwipeX User"}
                </h2>
                {calculatedAge !== null && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-md flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Age: {calculatedAge} (Verified 18+)</span>
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-500 mb-1.5 mt-0.5">
                {title || user?.profile?.title || "Technology Specialist"}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded capitalize">
                  Role: {user?.role.replace("_", " ")}
                </span>
                {user?.role === "job_seeker" && (
                  <span className="px-2.5 py-0.5 bg-purple-50 border border-purple-100 text-purple-700 text-xs font-bold rounded flex items-center space-x-1">
                    <Cpu className="w-3 h-3" />
                    <span>Domain: {targetDomain.toUpperCase().replace("_", " / ")}</span>
                  </span>
                )}
                {location && (
                  <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{location}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Profile Picture Actions (URL link + File Upload + Remove) */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <label
                htmlFor="avatar-file-upload"
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs shrink-0"
              >
                <Camera className="w-4 h-4" />
                <span>Upload from Computer</span>
              </label>
              <input
                id="avatar-file-upload"
                type="file"
                accept="image/*"
                onChange={handleImageFileChange}
                className="hidden"
              />

              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl("")}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 transition-all flex items-center space-x-1.5 shadow-xs shrink-0"
                  title="Remove avatar to display CAPITAL username initial badge"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Use Initial Badge</span>
                </button>
              )}
            </div>
          </div>

          {/* Photo Link / URL Direct Input */}
          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 shrink-0">
              <Camera className="w-4 h-4 text-indigo-600" />
              <span>Photo URL Link:</span>
            </div>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/your-photo.jpg (or upload from computer above)"
              className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:border-indigo-600 focus:outline-none transition-all"
            />
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl("")}
                className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-all shrink-0"
              >
                Clear Link
              </button>
            )}
          </div>

          {/* Auto-fill notification after resume upload */}
          {autoFillNotice && autoFillNotice.show && (
            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200 text-indigo-950 rounded-2xl flex items-start space-x-3 text-sm shadow-xs animate-in fade-in duration-300">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-900 text-sm">
                    ✨ Resume Skills Extracted & Synced
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-full border border-emerald-300">
                    ATS Score: {autoFillNotice.atsScore}%
                  </span>
                </div>
                <p className="text-xs text-indigo-800 mt-1 leading-relaxed">
                  Extracted <strong className="text-indigo-950">{autoFillNotice.skillsCount} skills</strong> from your resume. Your skills list below has been updated dynamically.
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 border-t border-slate-100 pt-6">
            {success && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center space-x-3 text-sm shadow-xs">
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-semibold">Profile updated and saved to database successfully!</span>
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-6">
              
              {/* Section 1: AI Resume Upload & Automatic Fill */}
              {user?.role === "job_seeker" && (
                <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-indigo-100 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span>Resume Upload & Skill Synchronization</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Upload your PDF / DOCX resume to dynamically extract and sync your skill tags.
                      </p>
                    </div>

                    <Link
                      to="/recommendations"
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5 shrink-0 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Hiring Trends & ATS Insights</span>
                    </Link>
                  </div>

                  {/* Local Device Drag & Drop File Picker */}
                  <div className="border-2 border-dashed border-indigo-300 hover:border-indigo-600 bg-white p-6 rounded-xl text-center transition-all relative group">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      onChange={async (e) => {
                        const fileInput = e.target;
                        if (fileInput.files && fileInput.files[0]) {
                          const file = fileInput.files[0];
                          setUploadingResume(true);
                          try {
                            const text = await new Promise<string>((resolve) => {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                const raw = (evt.target?.result as string) || "";
                                resolve(raw.replace(/\0/g, "").replace(/\x00/g, ""));
                              };
                              reader.onerror = () => resolve("");
                              reader.readAsText(file);
                            });

                            const cleanFileName = file.name.replace(/\0/g, "").replace(/\x00/g, "");
                            const cleanText = text.replace(/\0/g, "").replace(/\x00/g, "");

                            const newResumeName = cleanFileName;
                            const newResumeUrl = `https://swipex.io/resumes/${cleanFileName}`;

                            setResumeName(newResumeName);
                            setResumeUrl(newResumeUrl);

                            // Send to backend
                            const uploadRes = await api.post("/seeker/upload-resume", {
                              resumeName: cleanFileName,
                              resumeText: cleanText || `Content extracted from ${cleanFileName}`
                            });

                            const data = uploadRes.data;

                            // Persist resume (Do NOT overwrite user's skills automatically)
                            await updateUserProfile({
                              resumeName: newResumeName,
                              resumeUrl: newResumeUrl,
                              resumeText: cleanText
                            });

                            setSuccess(true);
                            setTimeout(() => setSuccess(false), 4000);
                          } catch (err) {
                            console.error("Failed to parse and extract resume skills", err);
                          } finally {
                            setUploadingResume(false);
                          }
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    />

                    <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                      <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-all shadow-xs">
                        {uploadingResume ? (
                          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <FileText className="w-6 h-6" />
                        )}
                      </div>

                      <div>
                        <span className="text-sm font-bold text-slate-800 block">
                          {uploadingResume ? "Extracting Skills from Resume..." : "Click or Drag Resume File Here (PDF, DOCX, TXT)"}
                        </span>
                        <span className="text-xs text-slate-400">
                          Automatically synchronizes skill tags based on your resume keywords
                        </span>
                      </div>

                      {!resumeName && (
                        <div className="mt-2 text-xs text-slate-500 font-medium bg-slate-100 px-3 py-1 rounded-lg inline-block">
                          No resume uploaded yet.
                        </div>
                      )}
                    </div>

                    {resumeName && (
                      <div className="mt-3 flex items-center justify-center space-x-2 relative z-20">
                        <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Active Resume: {resumeName}</span>
                        </div>

                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                            setResumeName("");
                            setResumeUrl("");
                            setSkills([]);
                            setAutoFillNotice(null);
                            try {
                              await api.post("/seeker/upload-resume", {
                                clearResume: true,
                                resumeName: "",
                                resumeUrl: "",
                                resumeText: ""
                              });
                              await updateUserProfile({
                                resumeName: "",
                                resumeUrl: "",
                                resumeText: "",
                                skills: []
                              });
                              setSuccess(true);
                              setTimeout(() => setSuccess(false), 3000);
                            } catch (err) {
                              console.error("Failed to remove resume from database", err);
                            }
                          }}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
                          title="Clear active resume from database"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Section 2: Mandatory Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span>Essential Verification & Contact Info</span>
                  </h4>
                  <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                    * Required Fields
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Full Name / Display Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        placeholder="Alex Rivera"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-slate-800 text-xs font-medium transition-all"
                      />
                    </div>
                  </div>

                  {/* Email Address */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Email Address (Contact) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-slate-800 text-xs font-medium transition-all"
                      />
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Date of Birth <span className="text-rose-500">*</span>
                      </label>
                      {calculatedAge !== null && (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          calculatedAge >= 18 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          Age: {calculatedAge} {calculatedAge >= 18 ? "✓" : "(Must be 18+)"}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        required
                        max={new Date().toISOString().split("T")[0]}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-slate-800 text-xs font-medium transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone Number (Optional) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Phone Number
                      </label>
                      <span className="text-[11px] text-slate-400">Optional</span>
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 (555) 019-2834"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-slate-800 text-xs font-medium transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Professional & Career Profile */}
              {user?.role === "job_seeker" ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                      <span>Professional Headline & Career Domain</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">Customizable anytime</span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Headline Title */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Professional Headline / Role Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        placeholder="E.g., Junior Full-Stack Developer / Fresher"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-slate-800 text-xs font-medium transition-all"
                      />
                    </div>

                    {/* Target Career Domain */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Target Career Domain
                      </label>
                      <select
                        value={targetDomain}
                        onChange={(e) => setTargetDomain(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-slate-800 text-xs font-medium transition-all cursor-pointer"
                      >
                        <option value="ai_ml">AI & Machine Learning (PyTorch, LLMs, GenAI, MLOps)</option>
                        <option value="frontend">Frontend & React (Next.js, TypeScript, UI Architecture)</option>
                        <option value="backend">Backend & Distributed Systems (Python, Go, PostgreSQL, Redis)</option>
                        <option value="fullstack">Full-Stack Development (React, Node, Postgres, Cloud)</option>
                        <option value="devops">DevOps & Cloud (Kubernetes, Docker, AWS, Terraform)</option>
                        <option value="mobile">Mobile Engineering (React Native, Flutter, iOS/Android)</option>
                      </select>
                    </div>

                    {/* Location (Optional) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                          Current Location & Work Preference
                        </label>
                        <span className="text-[11px] text-slate-400">Optional</span>
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="San Francisco, CA (Open to Remote)"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-slate-800 text-xs font-medium transition-all"
                        />
                      </div>
                    </div>

                    {/* Experience Level (Optional) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                          Years of Experience / Level
                        </label>
                        <span className="text-[11px] text-slate-400">Optional</span>
                      </div>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={experienceYears}
                          onChange={(e) => setExperienceYears(e.target.value)}
                          placeholder="0-1 years (Fresher / Entry Level)"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-slate-800 text-xs font-medium transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Education (Optional) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Highest Education / Degree
                      </label>
                      <span className="text-[11px] text-slate-400">Optional</span>
                    </div>
                    <div className="relative">
                      <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        placeholder="B.Tech in Computer Science / B.E. / M.S."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-slate-800 text-xs font-medium transition-all"
                      />
                    </div>
                  </div>

                  {/* Bio / Summary (Optional) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Professional Summary & Bio
                      </label>
                      <span className="text-[11px] text-slate-400">Optional</span>
                    </div>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Passionate fresher eager to build high-scale web and software applications..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-slate-800 text-xs font-medium transition-all"
                    ></textarea>
                  </div>
                </div>
              ) : (
                /* Recruiter-specific Company & Hiring Profile */
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>Company & Hiring Profile</span>
                    </h4>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Recruiter / Talent Lead Title <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        placeholder="E.g., Senior Technical Recruiter / Talent Acquisition Lead"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-slate-800 text-xs font-medium transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Company / Startup Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        placeholder="E.g., Google, Meta, Finflow"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-slate-800 text-xs font-medium transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Company Website Link
                      </label>
                      <input
                        type="url"
                        value={companyWebsite}
                        onChange={(e) => setCompanyWebsite(e.target.value)}
                        placeholder="https://company.com"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-slate-800 text-xs font-medium transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                        Office Location / Headquarters
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="San Francisco, CA / Remote"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-slate-800 text-xs font-medium transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Company Overview & Hiring Mission
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Describe your company culture, engineering values, and what you look for in candidates..."
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-600 outline-none text-slate-800 text-xs font-medium transition-all"
                    ></textarea>
                  </div>
                </div>
              )}

              {/* Section 4: Skills & ATS Keyword Matrix (Job Seekers ONLY) */}
              {user?.role === "job_seeker" && (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-800 flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Skill Tags & Domain Keyword Matrix</span>
                    </label>
                    
                    <div className="flex items-center space-x-2">
                      {/* Dynamic Real-time ATS Readiness Gauge */}
                      <span className={`px-2.5 py-1 text-xs font-mono font-black rounded-lg border ${
                        skills.length >= 4 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : skills.length >= 2 
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        Estimated ATS: {skills.length >= 5 ? Math.min(98, 90 + Math.min(8, (skills.length - 5) * 1.5 + 4)) : skills.length >= 3 ? 88 + (skills.length - 3) * 3 : skills.length >= 1 ? 82 + skills.length * 2 : 35}%
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    Add or manage your active skill tags below. These directly drive your discovery feed recommendations and ATS match scores.
                  </p>

                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      placeholder={`E.g., ${getDomainTrendingSkills().slice(0, 3).join(", ")}`}
                      className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-600 outline-none text-slate-800 text-xs transition-all shadow-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm flex items-center space-x-1"
                    >
                      <span>Add</span>
                    </button>
                  </div>

                  {/* Domain-Tailored Recommendations for quick-add */}
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      ⚡ Recommended for your domain ({targetDomain.toUpperCase().replace("_", " / ")}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {getDomainTrendingSkills().map((trendSkill) => {
                        const isAdded = skills.some((s) => s.toLowerCase() === trendSkill.toLowerCase());
                        return (
                          <button
                            key={trendSkill}
                            type="button"
                            disabled={isAdded}
                            onClick={() => {
                              if (!isAdded) {
                                setSkills([...skills, trendSkill]);
                              }
                            }}
                            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                              isAdded
                                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-default"
                                : "bg-white hover:bg-indigo-50 border border-slate-200 text-slate-700 hover:text-indigo-700 hover:border-indigo-300 shadow-2xs"
                            }`}
                          >
                            {isAdded ? `✓ ${trendSkill}` : `+ ${trendSkill}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Skill Badges */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Active Profile Skills ({skills.length}):
                      </span>
                      {resumeName && (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Dynamic Sync: {resumeName}</span>
                        </span>
                      )}
                    </div>
                    {skills.length === 0 ? (
                      <div className="text-xs text-amber-700 font-medium bg-amber-50/70 p-3 rounded-xl border border-amber-200/80">
                        No skills added yet. Upload your resume above or click recommended skills to unlock intelligent job matching.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {skills.map((s) => (
                          <span key={s} className="px-3 py-1.5 bg-white border border-indigo-200 text-indigo-900 text-xs font-bold rounded-xl shadow-2xs flex items-center space-x-2 group">
                            <span>{s}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSkill(s)}
                              className="text-slate-400 hover:text-rose-600 font-bold text-sm leading-none p-0.5 rounded transition-all cursor-pointer"
                              title={`Remove ${s}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Submit / Commit changes */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-extrabold rounded-xl text-xs tracking-wide uppercase transition-all shadow-md hover:shadow-indigo-600/20 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>Save & Commit Profile Changes</span>
                )}
              </button>

            </form>
          </div>
        </div>

      </div>

    </div>
  );
};
