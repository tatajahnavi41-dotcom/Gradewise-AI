import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  MessageSquare,
  Star,
  Send,
  CheckCircle2,
  Shield,
  Filter,
  UserCheck
} from 'lucide-react';

export default function FeedbackCentre() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [avgRating, setAvgRating] = useState(0.0);
  const [loading, setLoading] = useState(true);

  // Form states
  const [targetType, setTargetType] = useState('course');
  const [category, setCategory] = useState('Learning Materials & Clarity');
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await api.getFeedback();
      setFeedbacks(res.feedbacks || []);
      setAvgRating(res.average_rating || 0.0);
    } catch (err) {
      console.error('Failed to load feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.submitFeedback({
        target_type: targetType,
        category: category,
        rating: parseInt(rating),
        comments: comments,
        is_anonymous: isAnonymous
      });
      setSubmitMsg('Feedback submitted successfully! Thank you for your constructive evaluation.');
      setComments('');
      fetchFeedback();
      setTimeout(() => setSubmitMsg(null), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-cyan-400" />
            <span>Continuous Feedback & Usability Centre</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Student & faculty voice regarding lecture clarity, courseware relevance, and mentoring effectiveness.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-2 text-xs">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="font-bold text-white">{avgRating} / 5.0</span>
            <span className="text-slate-400">({feedbacks.length} reviews)</span>
          </div>
        </div>
      </div>

      {submitMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{submitMsg}</span>
        </div>
      )}

      {/* Main Grid: Form on Left, Past Feedbacks on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Feedback Submission Form */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-indigo-400" />
            <span>Submit Constructive Feedback</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Feedback Scope</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="course">Course & Syllabus Content</option>
                <option value="faculty">Faculty Teaching & Mentorship</option>
                <option value="campus">Campus Laboratories & Infrastructure</option>
                <option value="system">CampusIQ Platform Usability</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Evaluation Category</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Teaching Clarity, Exam Difficulty, Lab Support"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Rating (1 to 5 Stars)</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="font-mono text-slate-300 font-bold ml-2">{rating} Stars</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Your Observations / Suggestions</label>
              <textarea
                rows="4"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Share your specific feedback or learning difficulties..."
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="anon"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <label htmlFor="anon" className="text-slate-300 cursor-pointer">
                Submit anonymously (Identity protected from public view)
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Send Verified Feedback'}</span>
            </button>
          </form>
        </div>

        {/* Right: Feedback Log */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Verified Campus Reviews & Usability Log</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Live Audits</span>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading feedback log...</div>
            ) : feedbacks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No feedback submitted yet.</div>
            ) : (
              feedbacks.map((fb) => (
                <div key={fb.id} className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{fb.submitter_id}</span>
                      <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-800 text-slate-300">
                        {fb.target_type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-400">
                      {[...Array(fb.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                  </div>

                  <p className="text-slate-300 leading-relaxed">{fb.comments}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>Category: <strong className="text-slate-300">{fb.category}</strong></span>
                    <span>{fb.created_at}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
