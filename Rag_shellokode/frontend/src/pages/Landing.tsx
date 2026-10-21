import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FileText,
  Search,
  Sparkles,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  ExternalLink,
  Code2,
  Server,
  Terminal,
  Zap,
  Github,
  Linkedin,
  Globe,
  Award,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Landing: React.FC = () => {
  const { user } = useAuth();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const steps = [
    {
      num: '01',
      title: 'Upload Documents',
      desc: 'Provide supported documents including PDF, DOCX, PPTX, Excel, CSV, TXT, or scanned images.',
      icon: <FileText className="w-6 h-6 text-blue-600" />,
      badge: 'Multi-Format'
    },
    {
      num: '02',
      title: 'Process Text',
      desc: 'Extract clean document text and split it into semantic chunks using RecursiveCharacterTextSplitter.',
      icon: <Layers className="w-6 h-6 text-indigo-600" />,
      badge: 'LangChain'
    },
    {
      num: '03',
      title: 'Store and Retrieve',
      desc: 'Generate 1024-dim Voyage-3 embeddings and index them in user-isolated Qdrant vector collections.',
      icon: <Database className="w-6 h-6 text-cyan-600" />,
      badge: 'Voyage AI + Qdrant'
    },
    {
      num: '04',
      title: 'Generate Answers',
      desc: 'Send the question and retrieved context to the configured LLM through OpenRouter with fallback guards.',
      icon: <Cpu className="w-6 h-6 text-purple-600" />,
      badge: 'OpenRouter'
    },
    {
      num: '05',
      title: 'Display Results',
      desc: 'Show the verified, document-grounded answer with text-to-speech and dynamic Chart.js visualizations.',
      icon: <Sparkles className="w-6 h-6 text-emerald-600" />,
      badge: 'Interactive UI'
    }
  ];

  const technologies = [
    {
      name: 'Python & FastAPI',
      category: 'Backend Architecture',
      desc: 'High-performance async REST API with token authorization and CORS middleware.',
      icon: <Server className="w-6 h-6 text-yellow-600" />
    },
    {
      name: 'React 18 & TypeScript',
      category: 'Frontend Client',
      desc: 'Vite-powered single page app with Tailwind CSS, Chart.js, and Framer Motion.',
      icon: <Code2 className="w-6 h-6 text-blue-600" />
    },
    {
      name: 'Voyage AI (voyage-3)',
      category: 'Embedding Model',
      desc: '1024-dimensional contextual embeddings optimized for precise semantic document search.',
      icon: <Zap className="w-6 h-6 text-purple-600" />
    },
    {
      name: 'Qdrant Cloud',
      category: 'Vector Database',
      desc: 'Dedicated user-isolated collections (rag_<username>) with cosine distance indexing.',
      icon: <Database className="w-6 h-6 text-red-600" />
    },
    {
      name: 'OpenRouter (openrouter/free)',
      category: 'LLM Integration',
      desc: 'Context-grounded reasoning with automated fallback to secondary free models.',
      icon: <Cpu className="w-6 h-6 text-indigo-600" />
    },
    {
      name: 'MongoDB Atlas',
      category: 'Document & Auth Store',
      desc: 'Secure persistence for user accounts, session tokens, and file metadata tracking.',
      icon: <Terminal className="w-6 h-6 text-emerald-600" />
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 selection:bg-blue-100 selection:text-blue-900 font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/90 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-gray-900">
              Type<span className="text-blue-600">Hype</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-base font-medium text-gray-600">
            <button onClick={() => scrollToSection('about')} className="hover:text-black transition-colors">
              About
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-black transition-colors">
              How It Works
            </button>
            <button onClick={() => scrollToSection('tech-stack')} className="hover:text-black transition-colors">
              Tech Stack
            </button>
            <button onClick={() => scrollToSection('developer')} className="hover:text-black transition-colors">
              Developer
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-800 hover:bg-gray-100 text-sm font-semibold transition shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Login</span>
            </Link>

            <Link
              to={user ? "/upload" : "/register"}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-sm font-semibold shadow-md transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>{user ? 'Dashboard' : 'Register'}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32 bg-gradient-to-b from-gray-50 via-white to-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs md:text-sm font-semibold shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Retrieval-Augmented Generation Document Intelligence</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-gray-900 leading-[1.15]"
            >
              Your Documents. <br className="hidden sm:inline" />
              Your Knowledge. <br className="hidden sm:inline" />
              <span className="text-blue-600">One Intelligent Search.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
            >
              Upload documents, find relevant information, and get AI-generated answers using retrieval-augmented generation (RAG).
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link
                to={user ? "/upload" : "/login"}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-semibold text-base shadow-sm transition-all flex items-center justify-center gap-2"
              >
                Explore How It Works
              </button>
            </motion.div>
          </div>

          {/* AI Document Search Illustration (Clean White Theme) */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 max-w-5xl mx-auto"
          >
            <div className="rounded-3xl border border-gray-200 bg-white p-6 md:p-8 shadow-xl">
              {/* Search Mockup */}
              <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-gray-50 border border-gray-200 text-gray-500 mb-6 shadow-inner">
                <Search className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span className="text-sm md:text-base text-gray-800 font-medium truncate">
                  What are the candidate's core projects and technical stack?
                </span>
                <span className="ml-auto text-xs px-3 py-1 rounded-md bg-blue-100 text-blue-700 font-semibold hidden sm:inline-block">
                  RAG Activated
                </span>
              </div>

              {/* Connected Preview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                      <span>Documents</span>
                      <span className="text-blue-600">PDF, DOCX, XLSX</span>
                    </div>
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-800 shadow-sm">
                        <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="truncate">Resume_Manibharathi.pdf</span>
                      </div>
                      <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-800 shadow-sm">
                        <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="truncate">Project_Architecture.docx</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
                    Chunks stored in Qdrant Vector Cloud
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-blue-800 mb-2 uppercase tracking-wider">
                      <span>Vector Retrieval</span>
                      <span className="text-emerald-700 font-semibold">1024-dim</span>
                    </div>
                    <div className="text-xs text-gray-700 space-y-1.5 mt-3">
                      <p className="font-semibold text-blue-900">Voyage-3 Embedding Model</p>
                      <p className="text-gray-600">
                        Cosine similarity search locates exact semantic matches in milliseconds.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-blue-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Top relevant chunks retrieved</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl border border-gray-200 bg-gray-50/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                      <span>Grounded Answer</span>
                      <span className="text-purple-600">OpenRouter</span>
                    </div>
                    <div className="mt-3 p-3.5 rounded-xl bg-white border border-gray-200 text-xs text-gray-800 space-y-1 shadow-sm">
                      <p className="font-bold text-gray-900">Synthesized Response:</p>
                      <p className="text-gray-700 leading-relaxed text-[12px]">
                        Manibharathi has developed TypeHype (RAG document intelligence system), a Fire Alert system, and wildlife monitoring using Python, FastAPI, and Qdrant.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                    <span>Sources verified: 100%</span>
                    <span className="text-emerald-600 font-semibold">Zero Hallucination</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section - Short Version */}
      <section id="about" className="py-20 border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">About TypeHype</h2>
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
              TypeHype is an AI-powered document intelligence system that combines semantic search, vector storage, and large language models to help users find answers from their documents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50/70 hover:border-gray-300 transition space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">AI-powered document search</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Parse heterogeneous file types and locate relevant sentences with semantic vector matching.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50/70 hover:border-gray-300 transition space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Context-aware question answering</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Synthesize document context with OpenRouter LLMs to generate concise, factual answers.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-gray-200 bg-gray-50/70 hover:border-gray-300 transition space-y-3 shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">RAG-based information retrieval</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Eliminate manual keyword scanning with automated chunking and user-isolated Qdrant collections.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - Main Focus */}
      <section id="how-it-works" className="py-24 border-b border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 space-y-14">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
              Workflow Architecture
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              How TypeHype Works
            </h2>
            <p className="text-base md:text-lg text-gray-600">
              A five-stage connected pipeline engineered to transform raw unstructured documents into verifiable intelligence.
            </p>
          </div>

          {/* 5 Connected Step Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {steps.map((s) => (
              <div
                key={s.num}
                className="rounded-2xl border border-gray-200 bg-white p-6 flex flex-col justify-between hover:border-blue-400 hover:shadow-md transition-all duration-300 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-extrabold font-mono text-gray-300">
                      {s.num}
                    </span>
                    <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                      {s.icon}
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed">{s.desc}</p>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-800">
                    {s.badge}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* RAG Explanation Callout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <div className="lg:col-span-2 p-8 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-3 flex flex-col justify-center">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                What makes RAG essential?
              </h3>
              <p className="text-base text-gray-700 leading-relaxed">
                "RAG connects information retrieved from your documents with an LLM, helping produce answers grounded in relevant context instead of relying only on a general model response."
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-blue-200 bg-blue-50/70 shadow-sm space-y-3 flex flex-col justify-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800">Why this matters:</h4>
              <ul className="space-y-2 text-xs md:text-sm text-gray-800 font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Reduces manual searching through lengthy documents.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Helps retrieve relevant information quickly.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Provides document-grounded answers when relevant context is available.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section id="tech-stack" className="py-20 border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Verified Technology Stack</h2>
            <p className="text-base text-gray-600">
              Built exclusively with production-tested, verified components implemented directly in this codebase.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {technologies.map((t) => (
              <div
                key={t.name}
                className="p-6 rounded-2xl border border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300 hover:shadow-sm transition space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-white border border-gray-200 shadow-sm">{t.icon}</div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{t.category}</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{t.name}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Developed By Section */}
      <section id="developer" className="py-20 border-b border-gray-200 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="rounded-3xl border border-gray-200 bg-white p-8 md:p-12 shadow-md">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
              {/* Avatar Illustration */}
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gray-900 text-white flex items-center justify-center text-3xl font-extrabold shadow-md flex-shrink-0">
                MA
              </div>

              {/* Developer Details */}
              <div className="space-y-4 text-center sm:text-left flex-1">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">MANIBHARATHI A</h3>
                  <p className="text-sm md:text-base text-blue-600 font-semibold mt-1">
                    Computer Science and Engineering Student | AI and Software Development Enthusiast
                  </p>
                </div>

               
                {/* Clickable Links
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                  <a
                    href="https://manibharathi2006.netlify.app/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 transition"
                  >
                    <Globe className="w-4 h-4 text-blue-600" />
                    <span>Portfolio</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                  </a>

                  <a
                    href="https://github.com/itzmanibharathi"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 transition"
                  >
                    <Github className="w-4 h-4 text-gray-900" />
                    <span>GitHub</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                  </a>

                  <a
                    href="https://www.linkedin.com/in/itzmanibharathi/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 transition"
                  >
                    <Linkedin className="w-4 h-4 text-blue-700" />
                    <span>LinkedIn</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                  </a>

                  <a
                    href="https://leetcode.com/u/itzmanibharathi/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 transition"
                  >
                    <Award className="w-4 h-4 text-yellow-600" />
                    <span>LeetCode</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                  </a>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Explore Your Documents Smarter
          </h2>
          <p className="text-base md:text-xl text-gray-600 max-w-xl mx-auto">
            Experience document search and AI-powered question answering with TypeHype.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-900 font-semibold text-base shadow-sm transition-all"
            >
              <LogIn className="w-5 h-5 text-gray-700" />
              <span>Login to Account</span>
            </Link>
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center text-white">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-tight">TypeHype</span>
              </div>
              <p className="text-xs text-gray-600 mt-2 max-w-sm">
                Retrieval-Augmented Generation platform for intelligent document querying and analysis.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-gray-600">
              <button onClick={() => scrollToSection('about')} className="hover:text-black transition">About</button>
              <button onClick={() => scrollToSection('how-it-works')} className="hover:text-black transition">How It Works</button>
              <button onClick={() => scrollToSection('tech-stack')} className="hover:text-black transition">Tech Stack</button>
              <button onClick={() => scrollToSection('developer')} className="hover:text-black transition">Developer</button>
              <a
                href="https://manibharathi2006.netlify.app/"
                target="_blank"
                rel="noreferrer"
                className="hover:text-blue-600 transition flex items-center gap-1"
              >
                <span>Portfolio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 text-center sm:text-left">
            <p>© 2026 TypeHype. Developed by MANIBHARATHI A.</p>
            <p>Built with Voyage AI, Qdrant Cloud, and OpenRouter</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
