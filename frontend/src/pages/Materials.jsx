import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Download,
  Calendar,
  PlusCircle,
  FileText,
  Filter,
  CheckCircle2,
  ExternalLink,
  Sparkles
} from 'lucide-react';

export default function Materials() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState('ALL');

  // Form states for faculty upload
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [targetBranch, setTargetBranch] = useState('AIML');
  const [year, setYear] = useState(3);
  const [subjectCode, setSubjectCode] = useState('ML302');
  const [subjectName, setSubjectName] = useState('Machine Learning Techniques');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Notes');
  const [summary, setSummary] = useState('');
  const [uploadMsg, setUploadMsg] = useState(null);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const [matRes, examRes] = await Promise.all([
        api.getMaterials({ branch: branchFilter !== 'ALL' ? branchFilter : undefined }),
        api.getExams({ branch: branchFilter !== 'ALL' ? branchFilter : undefined })
      ]);
      setMaterials(matRes.materials || []);
      setExams(examRes.exams || []);
    } catch (err) {
      console.error('Failed to load materials:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [branchFilter]);

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      await api.addMaterial({
        branch: targetBranch,
        year: parseInt(year),
        subject_code: subjectCode,
        subject_name: subjectName,
        title: title,
        category: category,
        content_summary: summary
      });
      setShowUploadModal(false);
      setUploadMsg('Study material published to department repository!');
      setTitle('');
      setSummary('');
      fetchContent();
      setTimeout(() => setUploadMsg(null), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <span>Learning Materials, Syllabus & Exam Schedules</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Department notes, practice question banks, and upcoming exam difficulty indices for B.Tech courses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer font-medium"
            >
              <option value="ALL">All Branches</option>
              <option value="AIML">AIML</option>
              <option value="AIDS">AIDS</option>
              <option value="CSE">CSE</option>
            </select>
          </div>

          {user?.role !== 'student' && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publish Material</span>
            </button>
          )}
        </div>
      </div>

      {uploadMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{uploadMsg}</span>
        </div>
      )}

      {/* Main Grid: Materials Library on Left, Upcoming Exams on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Materials List */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Course Resource Repository</span>
          </h3>

          <div className="space-y-3">
            {loading ? (
              <div className="p-12 text-center text-slate-400 text-xs">Loading courseware materials...</div>
            ) : materials.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs glass-panel rounded-2xl border border-slate-800">
                No materials uploaded for this branch.
              </div>
            ) : (
              materials.map((m) => (
                <div key={m.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800 font-bold">
                        {m.subject_code}
                      </span>
                      <span className="font-bold text-white text-sm">{m.title}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                      {m.category}
                    </span>
                  </div>

                  <p className="text-slate-300 leading-relaxed">{m.content_summary}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                    <span>Course: <strong className="text-slate-300">{m.subject_name}</strong> [{m.branch} Y{m.year}]</span>
                    <a
                      href={m.download_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Resource</span>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Upcoming Exam Schedules with Difficulty */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Upcoming Examination Schedules & Difficulty</span>
          </h3>

          <div className="space-y-3">
            {exams.map((e) => (
              <div key={e.id} className="glass-panel p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{e.subject_name}</span>
                  <span className="font-mono text-amber-400 text-[11px] font-semibold">
                    Diff: {e.difficulty_index} / 5.0
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span className="font-mono text-cyan-300">{e.subject_code}</span>
                  <span>• Date: <strong className="text-slate-200">{e.exam_date}</strong></span>
                </div>
                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Key Syllabus Units:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {e.syllabus_topics?.map((top, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        {top}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modal: Faculty Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in">
            <h3 className="text-base font-bold text-white mb-1">Publish Learning Material</h3>
            <p className="text-xs text-slate-400 mb-4">
              Upload study guides, problem sheets, or reference code for students.
            </p>

            <form onSubmit={handleUpload} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Branch</label>
                  <select
                    value={targetBranch}
                    onChange={(e) => setTargetBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="AIML">AIML</option>
                    <option value="AIDS">AIDS</option>
                    <option value="CSE">CSE</option>
                    <option value="ALL">ALL Branches</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">B.Tech Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                  >
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Subject Code & Name</label>
                <input
                  type="text"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  required
                  placeholder="e.g. Machine Learning Techniques"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Material Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Unit 3 Deep Learning Master Notes"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Content Summary</label>
                <textarea
                  rows="3"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  required
                  placeholder="Key topics covered, formulas, algorithms..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
                >
                  Publish Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
