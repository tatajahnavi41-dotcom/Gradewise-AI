import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import confetti from 'canvas-confetti';
import {
  Gamepad2,
  Clock,
  Flame,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Code2,
  Image as ImageIcon
} from 'lucide-react';

export default function LearningArena({ onNavigate }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [timer, setTimer] = useState(60);
  const [isTimed, setIsTimed] = useState(true);

  const [resolvedStudentId, setResolvedStudentId] = useState(user?.student_id || '');

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      if (!user?.student_id && !resolvedStudentId) {
        const stResp = await api.getStudents();
        if (stResp?.students && stResp.students.length > 0) {
          setResolvedStudentId(stResp.students[0].student_id);
        }
      }
      const res = await api.getQuizQuestions();
      setQuestions(res.questions || []);
      setCurrentIndex(0);
      setSelectedOption(null);
      setSubmitted(false);
      setResult(null);
      setTimer(60);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!isTimed || submitted || loading || questions.length === 0) return;
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          handleSubmitAnswer();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimed, submitted, loading, questions, currentIndex]);

  const currentQ = questions[currentIndex];

  const handleSubmitAnswer = async () => {
    if (!currentQ || submitted) return;
    setSubmitted(true);
    try {
      const res = await api.submitQuizAnswer({
        question_id: currentQ.id,
        student_id: user?.student_id || resolvedStudentId || 'STUDENT_01',
        selected_answer: selectedOption || 'NO_ANSWER_TIMEOUT',
        time_spent_secs: 60 - timer
      });
      setResult(res);

      if (res.is_correct) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
    } catch (err) {
      console.error('Error submitting quiz answer:', err);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setSubmitted(false);
      setResult(null);
      setTimer(60);
    } else {
      // Reached end, loop or show completion
      alert('Congratulations! You have completed all Arena practice problems for this session.');
      fetchQuestions();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentQ) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        No active questions found in Learning Arena library.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-cyan-400" />
            <span>Gamified Learning Arena</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visual algorithms, code debugging puzzles, and aptitude challenges with instant answer auditing.
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono font-bold text-white">{timer}s</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs text-cyan-400 font-mono font-semibold">
            <span>Q {currentIndex + 1} of {questions.length}</span>
          </div>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        
        {/* Question Header & Meta */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-semibold">
              {currentQ.subject}
            </span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              {currentQ.question_type}
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Difficulty: <strong className="text-amber-400">{currentQ.difficulty}</strong>
          </span>
        </div>

        {/* Title and Question Text */}
        <div>
          <h2 className="text-lg font-bold text-white">{currentQ.title}</h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">{currentQ.question_text}</p>
        </div>

        {/* Render SVG Diagram if visual DSA question */}
        {currentQ.image_svg && (
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-center overflow-x-auto">
            <div dangerouslySetInnerHTML={{ __html: currentQ.image_svg }} />
          </div>
        )}

        {/* Render Code Snippet if code debugging question */}
        {currentQ.code_snippet && (
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-2 font-sans flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5" />
              <span>Inspection Snippet</span>
            </div>
            <pre className="text-slate-200">{currentQ.code_snippet}</pre>
          </div>
        )}

        {/* Options Selection */}
        <div className="space-y-2.5 pt-2">
          {currentQ.options?.map((opt, idx) => {
            const isSelected = selectedOption === opt;
            const isCorrectAnswer = result && opt.trim().toLowerCase() === result.correct_answer.trim().toLowerCase();
            const isWrongSelection = result && isSelected && !result.is_correct;

            return (
              <button
                key={idx}
                type="button"
                disabled={submitted}
                onClick={() => setSelectedOption(opt)}
                className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                  submitted
                    ? isCorrectAnswer
                      ? 'bg-emerald-950/30 border-emerald-500 text-emerald-200'
                      : isWrongSelection
                      ? 'bg-rose-950/30 border-rose-500 text-rose-200'
                      : 'bg-slate-900/40 border-slate-800 text-slate-500'
                    : isSelected
                    ? 'bg-gradient-to-r from-indigo-950 to-slate-900 border-cyan-400 text-white shadow-md'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 font-mono flex items-center justify-center font-bold text-[11px]">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span>{opt}</span>
                </div>
                {submitted && isCorrectAnswer && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                {submitted && isWrongSelection && (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Result & Explanation Feedback Panel */}
        {submitted && result && (
          <div className={`p-4 rounded-xl border text-xs space-y-2 animate-in fade-in ${
            result.is_correct ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-rose-950/20 border-rose-500/40'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`font-bold flex items-center gap-1.5 ${result.is_correct ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.is_correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                <span>{result.is_correct ? 'Correct! +25 Growth Points Awarded' : 'Incorrect Solution'}</span>
              </span>
              <span className="font-mono text-slate-400 text-[11px]">
                🔥 Streak: {result.new_streak}d
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong className="text-white">Explanation: </strong>
              {result.explanation}
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={fetchQuestions}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Library</span>
          </button>

          {!submitted ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={!selectedOption}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md transition-all"
            >
              Submit Answer
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:opacity-95 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2"
            >
              <span>Next Challenge</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>

    </div>
  );
}
