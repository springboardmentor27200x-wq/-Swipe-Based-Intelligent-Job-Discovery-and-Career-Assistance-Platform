import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Building, Rocket, ShieldCheck, MapPin, ExternalLink, 
  Search, Users, Briefcase, Filter, Sparkles, Star, Award 
} from "lucide-react";

interface CompanyData {
  id: string;
  name: string;
  type: "mnc" | "startup" | "newly_founded";
  category: string;
  location: string;
  size: string;
  founded: string;
  description: string;
  logo: string;
  openRoles: number;
  rating: number;
  highlights: string[];
}

const companiesDatabase: CompanyData[] = [
  {
    id: "company-1",
    name: "Google",
    type: "mnc",
    category: "Cloud & Artificial Intelligence",
    location: "Mountain View, CA (Hybrid)",
    size: "150,000+ employees",
    founded: "1998",
    description: "Google's mission is to organize the world's information and make it universally accessible and useful. The core Google Cloud AI team builds pioneers for modern generative application engines.",
    logo: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&q=80&w=150",
    openRoles: 2,
    rating: 4.6,
    highlights: ["Global Scale", "Generative AI Pioneers", "Elite Engineering Culture"]
  },
  {
    id: "company-2",
    name: "Netflix",
    type: "mnc",
    category: "Entertainment & Media Streaming",
    location: "Los Gatos, CA (Remote Friendly)",
    size: "12,000+ employees",
    founded: "1997",
    description: "Netflix is the world's leading streaming entertainment service with over 230 million paid memberships. We focus heavily on distributed backend microservices and streaming optimizations.",
    logo: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=150",
    openRoles: 2,
    rating: 4.4,
    highlights: ["Distributed Architecture", "High Autonomy", "Market Leading Pay"]
  },
  {
    id: "company-3",
    name: "HypeSpace",
    type: "startup",
    category: "Social Tech & Content Platforms",
    location: "San Francisco, CA (Hybrid)",
    size: "45 employees",
    founded: "2023",
    description: "HypeSpace is a fast-growing series-A content tech startup serving next-generation community content loops. We pride ourselves on fast shipment cycles, modern React stacks, and high user density.",
    logo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=150",
    openRoles: 1,
    rating: 4.8,
    highlights: ["Series-A Venture Backed", "High Growth Loop", "Young Agile Team"]
  },
  {
    id: "company-4",
    name: "AetherLabs",
    type: "newly_founded",
    category: "AI Stealth Venture",
    location: "Austin, TX (In-Office)",
    size: "8 employees",
    founded: "2025",
    description: "AetherLabs is a newly founded venture-backed stealth startup coordinating high-performance AI model pipelines, real-time agent chains, and distributed GPU clusters.",
    logo: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=150",
    openRoles: 2,
    rating: 5.0,
    highlights: ["Stealth AI Technology", "Pre-Seed Funded", "First Core Hires"]
  },
  {
    id: "company-5",
    name: "Finflow Inc.",
    type: "startup",
    category: "Financial Treasury Technology",
    location: "New York, NY (Hybrid)",
    size: "85 employees",
    founded: "2021",
    description: "Finflow digitizes commercial banking operations with stateful asset pipelines, automatic ledger reconciliation, and strict transaction validation microservices.",
    logo: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=150",
    openRoles: 1,
    rating: 4.2,
    highlights: ["Fintech Innovators", "Series-B Scaleup", "TypeScript Infrastructure"]
  }
];

export const Companies: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const filteredCompanies = companiesDatabase.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesType = selectedType === "all" || c.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Title & Description */}
      <div className="mb-8">
        <span className="text-xs font-black uppercase text-indigo-600 tracking-widest block mb-1">
          Discovery Radar
        </span>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
          SwipeX Certified Partners
        </h2>
        <p className="text-slate-500 text-xs mt-1 max-w-2xl">
          Browse verified hiring partners—ranging from Multinational Corporations (MNCs) to fast-scaling Startups and early Stealth ventures.
        </p>
      </div>

      {/* Control Filters and Search */}
      <div className="grid md:grid-cols-12 gap-4 mb-8">
        {/* Search Bar */}
        <div className="md:col-span-8 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search partners by name, description, or focus category..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-indigo-600 shadow-xs transition-all"
          />
        </div>

        {/* Type selection */}
        <div className="md:col-span-4 flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-600 cursor-pointer"
          >
            <option value="all">All Enterprise Types</option>
            <option value="mnc">MNC (Multinational)</option>
            <option value="startup">Scaleup Startup</option>
            <option value="newly_founded">Stealth / Newly Founded</option>
          </select>
        </div>
      </div>

      {/* Grid listing */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredCompanies.map((c) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={c.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between"
            >
              <div>
                {/* Header: logo + company category */}
                <div className="flex items-start justify-between mb-4">
                  <img
                    src={c.logo}
                    alt={c.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-100 shadow-xs shrink-0 referrerPolicy='no-referrer'"
                  />
                  
                  {/* Category Type Badge */}
                  <span className={`px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider ${
                    c.type === "mnc" 
                      ? "bg-blue-50 text-blue-700 border border-blue-100" 
                      : c.type === "startup" 
                      ? "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                      : "bg-amber-50 text-amber-700 border border-amber-100"
                  }`}>
                    {c.type === "mnc" ? "MNC" : c.type === "startup" ? "Startup" : "Newly Founded"}
                  </span>
                </div>

                {/* Company Name, Stars & category */}
                <div className="mb-3">
                  <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center space-x-1.5">
                    <span>{c.name}</span>
                    <span className="text-xs text-amber-500 font-bold flex items-center space-x-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                      <span>{c.rating.toFixed(1)}</span>
                    </span>
                  </h3>
                  <span className="text-[11px] font-bold text-slate-400 block mt-0.5">
                    {c.category}
                  </span>
                </div>

                {/* Locations and Sizes */}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mb-4 text-[11px] text-slate-500 font-medium">
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.location}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{c.size}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
                  {c.description}
                </p>

                {/* Highlight badges */}
                <div className="flex flex-wrap gap-1 mb-6">
                  {c.highlights.map((h, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-50 text-slate-600 text-[9px] font-bold rounded border border-slate-100">
                      ✨ {h}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer: Open positions count & link */}
              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-semibold flex items-center space-x-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="font-bold text-slate-700">{c.openRoles} Active Jobs</span>
                </span>

                <button
                  onClick={() => alert(`Visiting official careers portal of ${c.name}`)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-100 text-slate-700 hover:text-indigo-700 text-[10px] font-bold rounded-lg transition-all flex items-center space-x-1 cursor-pointer"
                >
                  <span>Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

            </motion.div>
          ))}

          {filteredCompanies.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-100 p-8">
              <Building className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No partner matches your criteria</h3>
              <p className="text-xs text-slate-400 mt-1">Try clearing your search query or choosing another type selection.</p>
            </div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};
