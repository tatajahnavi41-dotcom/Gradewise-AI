import React, { useState } from 'react';
import { api } from '../services/api';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  RefreshCw,
  Database
} from 'lucide-react';

export default function DataIntegration() {
  const [dataType, setDataType] = useState('academics');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewResult, setPreviewResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitMessage, setCommitMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setPreviewResult(null);
      setErrorMsg(null);
      setCommitMessage(null);
    }
  };

  const handlePreview = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setLoading(true);
    setErrorMsg(null);
    setCommitMessage(null);

    try {
      const res = await api.previewCsv(dataType, selectedFile);
      setPreviewResult(res);
    } catch (err) {
      setErrorMsg(err.message || 'Error parsing CSV file');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!previewResult || !previewResult.sample_valid_rows) return;

    setCommitting(true);
    try {
      const res = await api.commitData({
        data_type: dataType,
        rows: previewResult.sample_valid_rows,
      });
      setCommitMessage(res.message);
      setPreviewResult(null);
      setSelectedFile(null);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to commit updates to database.');
    } finally {
      setCommitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-cyan-400" />
            <span>Data Integration Centre (CSV Import & Ingestion)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Safely ingest new academic marks, lecture attendance rolls, or LMS logs with pre-flight schema validation.
          </p>
        </div>

        {/* Downloadable templates strip */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400 font-semibold">Sample Templates:</span>
          {['academics', 'attendance', 'lms_activity', 'placement_scores'].map((tmpl) => (
            <a
              key={tmpl}
              href={api.getTemplateDownloadUrl(tmpl)}
              download
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-cyan-300 font-medium transition-colors"
            >
              <Download className="w-3 h-3" />
              <span className="capitalize">{tmpl.replace('_', ' ')}</span>
            </a>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {commitMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{commitMessage}</span>
        </div>
      )}

      {/* Upload and Configuration Form */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <form onSubmit={handlePreview} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Target Data Pipeline
              </label>
              <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="academics">Academic Exam Scores & CGPA</option>
                <option value="attendance">Classroom Attendance Logs</option>
                <option value="lms">LMS Activity & Assignment Submissions</option>
                <option value="placement">Placement Coding & Aptitude Benchmarks</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Select CSV Data File
              </label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={loading || !selectedFile}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2"
            >
              {loading ? (
                <span>Validating Schema...</span>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Preview & Validate CSV Rows</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Validation & Preview Panel */}
      {previewResult && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
                <span>Pre-Flight Validation Preview: {previewResult.filename}</span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Total Rows Parsed: <strong className="text-white">{previewResult.total_rows_parsed}</strong> • Valid Records: <strong className="text-emerald-400">{previewResult.valid_count}</strong> • Errors: <strong className="text-rose-400">{previewResult.error_count}</strong>
              </p>
            </div>

            {previewResult.valid_count > 0 && (
              <button
                onClick={handleCommit}
                disabled={committing}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                <span>{committing ? 'Merging into DB...' : `Commit ${previewResult.valid_count} Records to DB`}</span>
              </button>
            )}
          </div>

          {/* Errors list if any */}
          {previewResult.errors?.length > 0 && (
            <div className="p-3 bg-rose-950/20 border border-rose-500/40 rounded-xl space-y-1 text-xs">
              <span className="font-bold text-rose-400">Row-Level Verification Warnings:</span>
              <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                {previewResult.errors.map((err, i) => (
                  <p key={i} className="text-[11px] text-rose-300">
                    Line {err.row} ({err.student_id}): {err.error}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Valid sample rows table */}
          {previewResult.sample_valid_rows?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    {Object.keys(previewResult.sample_valid_rows[0]).map((h) => (
                      <th key={h} className="py-2.5 px-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {previewResult.sample_valid_rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      {Object.values(row).map((v, cIdx) => (
                        <td key={cIdx} className="py-2.5 px-3 text-slate-300">{String(v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
