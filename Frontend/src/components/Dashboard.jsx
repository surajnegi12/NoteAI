import React, { useState, useEffect, useMemo, useRef } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/ThemeContext';
import ThemeToggle from './ThemeToggle';
import {
  Sparkles,
  Trash2,
  Tag,
  CheckSquare,
  LogOut,
  Search,
  Copy,
  Check,
  Zap,
  CheckCircle2,
  Circle,
  FileText,
  ShieldCheck,
  Cpu,
  Mic,
  MicOff,
  TrendingUp,
  X,
  ListTodo,
  AlertCircle,
  Info,
  Pin,
  Volume2,
  VolumeX,
  Download,
  LayoutGrid,
  Kanban
} from 'lucide-react';

function MarkdownView({ content, isDark }) {
  if (!content) return null;

  return (
    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.65 }}>
      {content.split('\n').map((line, idx) => {
        if (line.startsWith('### ')) {
          return <h5 key={idx} style={{ margin: '8px 0 4px', fontWeight: 700, fontSize: 13, color: isDark ? '#f8fafc' : '#0f172a' }}>{line.slice(4)}</h5>;
        }
        if (line.startsWith('## ')) {
          return <h4 key={idx} style={{ margin: '10px 0 6px', fontWeight: 700, fontSize: 14, color: isDark ? '#f8fafc' : '#0f172a' }}>{line.slice(3)}</h4>;
        }
        if (line.startsWith('# ')) {
          return <h3 key={idx} style={{ margin: '12px 0 8px', fontWeight: 800, fontSize: 15, color: isDark ? '#f8fafc' : '#0f172a' }}>{line.slice(2)}</h3>;
        }
        if (line.startsWith('- ') || line.startsWith('* ')) {
          return (
            <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', margin: '2px 0' }}>
              <span style={{ color: '#6366f1' }}>•</span>
              <span>{line.slice(2)}</span>
            </div>
          );
        }
        return <p key={idx} style={{ margin: line.trim() ? '4px 0' : '8px 0' }}>{line}</p>;
      })}
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { theme, mode } = useTheme();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);

  // Layout View State
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'kanban'

  // Search, Filter & Command Palette
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Pinning & Interactive Action Items State
  const [pinnedIds, setPinnedIds] = useState(new Set());
  const [completedItems, setCompletedItems] = useState({});

  // Audio Playback (TTS) & Voice Dictation
  const [speakingId, setSpeakingId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // Toast Notifications Hub State
  const [toasts, setToasts] = useState([]);
  const newNoteInputRef = useRef(null);

  const isDark = mode === 'dark';

  const addToast = (message, type = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 1800);
  };

  // Keyboard shortcut listener 
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsCommandOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Web Speech Recognition Initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setContent((prev) => prev + (prev.length > 0 ? ' ' : '') + transcript);
      };

      recognition.onerror = () => {
        setIsRecording(false);
        addToast('Voice dictation error or permission denied.', 'error');
      };

      recognition.onend = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      addToast('Voice recognition is not supported in this browser.', 'error');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      addToast('Voice recording stopped.');
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        addToast('Listening... Speak clearly.', 'info');
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Text-To-Speech (TTS) Reader
  const toggleSpeak = (id, text) => {
    if (!('speechSynthesis' in window)) {
      addToast('TTS Audio is not supported in this browser.', 'error');
      return;
    }

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
    addToast('Reading summary out loud...', 'info');
  };

  // Export Note as Markdown file
  const exportAsMarkdown = (note) => {
    const mdContent = `# ${note.title}\n\n${note.content}\n\n${
      note.summary ? `## AI Summary\n${note.summary}\n\n` : ''
    }${
      note.actionItems?.length
        ? `## Action Items\n${note.actionItems.map((item) => `- [ ] ${item}`).join('\n')}\n\n`
        : ''
    }Tags: ${note.tags?.join(', ') || 'None'}\n`;

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${note.title.toLowerCase().replace(/\s+/g, '-')}.md`;
    link.click();
    URL.revokeObjectURL(url);
    addToast('Note exported as Markdown (.md)');
  };

  const togglePin = (id) => {
    const willBePinned = !pinnedIds.has(id);

    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (willBePinned) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });

    addToast(willBePinned ? 'Note pinned to top' : 'Note unpinned');
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notes');
      setNotes(res.data);
    } catch (err) {
      addToast('Failed to fetch workspace notes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreateNote = async (e, analyze = false) => {
    if (e) e.preventDefault();
    if (!title.trim() || !content.trim()) {
      addToast('Title and content are required.', 'error');
      return;
    }

    if (analyze) setIsAiLoading(true);

    try {
      await api.post('/notes', { title, content, runAi: analyze });
      setTitle('');
      setContent('');
      addToast(analyze ? 'Note created & synthesized with Gemini!' : 'Raw note saved successfully.');
      await fetchNotes();
    } catch (err) {
      addToast('Failed to create note.', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAnalyzeExisting = async (id) => {
    setAnalyzingId(id);
    try {
      const res = await api.post(`/notes/${id}/analyze`);
      setNotes(notes.map((n) => (n._id === id ? res.data : n)));
      addToast('Note analyzed and updated successfully.');
    } catch (err) {
      addToast('AI Analysis failed.', 'error');
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notes/${id}`);
      setNotes(notes.filter((n) => n._id !== id));
      addToast('Note deleted from workspace.');
    } catch (err) {
      addToast('Failed to delete note.', 'error');
    }
  };

  const handleCopySummary = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast('Summary copied to clipboard!');
    setTimeout(() => setCopiedId(null), 1800);
  };

  const toggleActionItem = (noteId, itemIndex) => {
    const key = `${noteId}-${itemIndex}`;
    setCompletedItems((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const getCardAccent = (tags) => {
    if (!tags || tags.length === 0) return '#6366f1';
    const tag = tags[0].toLowerCase();
    if (tag.includes('sec') || tag.includes('warn') || tag.includes('crit')) return '#ef4444';
    if (tag.includes('prod') || tag.includes('feature') || tag.includes('dev')) return '#3b82f6';
    if (tag.includes('plan') || tag.includes('sync') || tag.includes('meet')) return '#10b981';
    return '#8b5cf6';
  };

  const allTags = useMemo(() => {
    const tagSet = new Set();
    notes.forEach((n) => n.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet);
  }, [notes]);

  const metrics = useMemo(() => {
    let totalActions = 0;
    let completedActions = 0;
    let totalSummaries = 0;

    notes.forEach((n) => {
      if (n.summary) totalSummaries++;
      if (n.actionItems && Array.isArray(n.actionItems)) {
        n.actionItems.forEach((_, idx) => {
          totalActions++;
          if (completedItems[`${n._id}-${idx}`]) {
            completedActions++;
          }
        });
      }
    });

    return {
      totalNotes: notes.length,
      totalSummaries,
      totalActions,
      completedActions,
      completionRate: totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0
    };
  }, [notes, completedItems]);

  const filteredNotes = useMemo(() => {
    const list = notes.filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.summary?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesTag = selectedTag ? note.tags?.includes(selectedTag) : true;
      return matchesSearch && matchesTag;
    });

    return list.sort((a, b) => {
      const aPinned = pinnedIds.has(a._id);
      const bPinned = pinnedIds.has(b._id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });
  }, [notes, searchQuery, selectedTag, pinnedIds]);

  const renderNoteCard = (note) => {
    const accentColor = getCardAccent(note.tags);
    const isPinned = pinnedIds.has(note._id);

    return (
      <div
        key={note._id}
        onMouseMove={handleMouseMove}
        style={{
          position: 'relative',
          background: isDark
            ? 'radial-gradient(400px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(99, 102, 241, 0.12), rgba(15, 23, 42, 0.75) 45%)'
            : 'radial-gradient(400px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), rgba(99, 102, 241, 0.06), #ffffff 45%)',
          borderRadius: 18,
          border: `1px solid ${isPinned ? accentColor : (isDark ? 'rgba(255, 255, 255, 0.07)' : '#e2e8f0')}`,
          borderLeft: `4px solid ${accentColor}`,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: isPinned
            ? `0 12px 28px -10px ${accentColor}33`
            : (isDark ? '0 10px 25px -10px rgba(0, 0, 0, 0.5)' : '0 4px 16px -2px rgba(0, 0, 0, 0.04)'),
          transition: 'transform 0.15s ease, border-color 0.15s ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
      >
        {/* Header Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <h3 style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              color: isDark ? '#f8fafc' : '#0f172a',
              lineHeight: 1.4,
              letterSpacing: '-0.02em'
            }}>
              {note.title}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => togglePin(note._id)}
              style={{
                background: 'none',
                border: 'none',
                color: isPinned ? accentColor : (isDark ? '#64748b' : '#94a3b8'),
                cursor: 'pointer',
                padding: 4
              }}
              title={isPinned ? 'Unpin note' : 'Pin to top'}
            >
              <Pin size={15} style={{ transform: isPinned ? 'rotate(45deg)' : 'none' }} />
            </button>

            <button
              onClick={() => exportAsMarkdown(note)}
              style={{ background: 'none', border: 'none', color: isDark ? '#64748b' : '#94a3b8', cursor: 'pointer', padding: 4 }}
              title="Export as Markdown"
            >
              <Download size={15} />
            </button>

            <button
              onClick={() => handleDelete(note._id)}
              style={{ background: 'none', border: 'none', color: isDark ? '#64748b' : '#94a3b8', cursor: 'pointer', padding: 4 }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ef4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = isDark ? '#64748b' : '#94a3b8')}
              title="Delete note"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Note Content */}
        <div style={{
          color: isDark ? '#94a3b8' : '#475569',
          fontSize: 13.5,
          lineHeight: 1.65,
          maxHeight: 140,
          overflowY: 'auto',
          paddingRight: 6
        }}>
          <MarkdownView content={note.content} isDark={isDark} />
        </div>

        {/* AI Summary Block with Text-To-Speech Button */}
        {note.summary ? (
          <div style={{
            background: isDark ? 'rgba(16, 185, 129, 0.06)' : '#f0fdf4',
            border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.2)' : '#bbf7d0'}`,
            borderRadius: 14,
            padding: '12px 14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontWeight: 700, fontSize: 12 }}>
                <Sparkles size={13} />
                <span>AI Summary</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => toggleSpeak(note._id, note.summary)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: speakingId === note._id ? '#10b981' : (isDark ? '#94a3b8' : '#64748b'),
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  title="Read aloud"
                >
                  {speakingId === note._id ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  <span>{speakingId === note._id ? 'Stop' : 'Listen'}</span>
                </button>

                <button
                  onClick={() => handleCopySummary(note._id, note.summary)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isDark ? '#94a3b8' : '#64748b',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                >
                  {copiedId === note._id ? <Check size={12} color="#10b981" /> : <Copy size={12} />}
                  <span>{copiedId === note._id ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: isDark ? '#a7f3d0' : '#166534', lineHeight: 1.55 }}>
              {note.summary}
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleAnalyzeExisting(note._id)}
            disabled={analyzingId === note._id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '9px 12px',
              borderRadius: 10,
              border: '1px dashed #6366f1',
              background: 'rgba(99, 102, 241, 0.05)',
              color: '#6366f1',
              fontSize: 12,
              fontWeight: 700,
              cursor: analyzingId === note._id ? 'not-allowed' : 'pointer'
            }}
          >
            <Zap size={13} />
            <span>{analyzingId === note._id ? 'Analyzing with Gemini...' : 'Analyze with AI'}</span>
          </button>
        )}

        {/* Action Items Checklist */}
        {note.actionItems?.length > 0 && (
          <div style={{
            background: isDark ? 'rgba(59, 130, 246, 0.06)' : '#eff6ff',
            border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : '#bfdbfe'}`,
            borderRadius: 14,
            padding: '12px 14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#3b82f6', fontWeight: 700, fontSize: 12, marginBottom: 8 }}>
              <CheckSquare size={13} />
              <span>Action Items ({note.actionItems.filter((_, i) => completedItems[`${note._id}-${i}`]).length}/{note.actionItems.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {note.actionItems.map((item, idx) => {
                const isDone = !!completedItems[`${note._id}-${idx}`];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleActionItem(note._id, idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 9,
                      fontSize: 12.5,
                      lineHeight: 1.45,
                      cursor: 'pointer',
                      userSelect: 'none',
                      color: isDone ? (isDark ? '#64748b' : '#94a3b8') : (isDark ? '#bfdbfe' : '#1e40af'),
                      textDecoration: isDone ? 'line-through' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isDone ? (
                      <CheckCircle2 size={14} style={{ marginTop: 2, flexShrink: 0, color: '#10b981' }} />
                    ) : (
                      <Circle size={14} style={{ marginTop: 2, flexShrink: 0, color: '#3b82f6' }} />
                    )}
                    <span>{item}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tags */}
        {note.tags?.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto', paddingTop: 6 }}>
            {note.tags.map((tag, idx) => (
              <span
                key={idx}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9',
                  border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}`,
                  color: isDark ? '#94a3b8' : '#64748b',
                  padding: '4px 10px',
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Tag size={10} color={accentColor} /> {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundColor: isDark ? '#080c16' : '#f8fafc',
      backgroundImage: isDark
        ? `radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.15), transparent)`
        : `radial-gradient(rgba(0, 0, 0, 0.04) 1px, transparent 1px), radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99, 102, 241, 0.06), transparent)`,
      backgroundSize: '24px 24px, 100% 100%',
      color: isDark ? '#f8fafc' : '#0f172a',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>

      {/* ---  Navbar --- */}
      <header
  className="nav-header"
  style={{
    position: 'sticky',
    top: 0,
    zIndex: 100,
    width: '100%',
    background: isDark ? 'rgba(8, 12, 22, 0.88)' : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)'}`,
    boxShadow: isDark 
      ? '0 16px 36px -12px rgba(0, 0, 0, 0.6)' 
      : '0 6px 24px -6px rgba(15, 23, 42, 0.06)',
    padding: '16px 32px',
    boxSizing: 'border-box',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14
  }}
>
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <div style={{
      width: 40,
      height: 40,
      borderRadius: 12,
      background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #4f46e5 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 6px 18px rgba(99, 102, 241, 0.4)',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      flexShrink: 0
    }}>
      <Sparkles size={20} color="#ffffff" />
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="nav-brand-text" style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.03em', color: isDark ? '#ffffff' : '#0f172a', lineHeight: 1 }}>
          Note<span style={{ color: '#6366f1' }}>AI</span>
        </span>
        
        <span className="hide-on-mobile" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          padding: '2px 7px',
          borderRadius: 6,
          background: isDark ? 'rgba(99, 102, 241, 0.15)' : '#e0e7ff',
          color: '#6366f1',
          border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : '#c7d2fe'}`
        }}>
          <span style={{ position: 'relative', display: 'flex', width: 5, height: 5 }}>
            <span className="pulse-ring" style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span style={{ position: 'relative', width: 5, height: 5, borderRadius: '50%', backgroundColor: '#10b981' }} />
          </span>
          Studio
        </span>
      </div>

      <span className="hide-on-mobile" style={{ fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', fontWeight: 500 }}>
        Gemini 3.6 Flash
      </span>
    </div>
  </div>

  <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>

    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9',
      borderRadius: 10,
      padding: 3,
      border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`
    }}>
      <button
        onClick={() => setViewMode('grid')}
        title="Grid View"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '6px 9px',
          borderRadius: 7,
          border: 'none',
          background: viewMode === 'grid' ? '#6366f1' : 'transparent',
          color: viewMode === 'grid' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        <LayoutGrid size={14} />
        <span className="hide-on-mobile">Grid</span>
      </button>
      <button
        onClick={() => setViewMode('kanban')}
        title="Kanban Board"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          padding: '6px 9px',
          borderRadius: 7,
          border: 'none',
          background: viewMode === 'kanban' ? '#6366f1' : 'transparent',
          color: viewMode === 'kanban' ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        <Kanban size={14} />
        <span className="hide-on-mobile">Board</span>
      </button>
    </div>

    {/* Search Trigger */}
    <button
      onClick={() => setIsCommandOpen(true)}
      title="Search (⌘K)"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 12px',
        borderRadius: 10,
        background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
        color: isDark ? '#94a3b8' : '#64748b',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        outline: 'none'
      }}
    >
      <Search size={15} />
      <span className="hide-on-mobile">Search</span>
      <kbd className="hide-on-mobile" style={{
        fontFamily: 'monospace',
        fontSize: 10,
        background: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
        padding: '2px 5px',
        borderRadius: 4,
        color: isDark ? '#cbd5e1' : '#475569'
      }}>⌘K</kbd>
    </button>

    <ThemeToggle />

    {/* User Avatar */}
    <div
      title={user?.email}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 8px 4px 4px',
        borderRadius: 99,
        background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#ffffff',
        border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`
      }}
    >
      <div style={{
        width: 26,
        height: 26,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
        color: '#ffffff',
        fontSize: 11,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
      </div>
      <span className="user-email-text" style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#f1f5f9' : '#1e293b', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {user?.email}
      </span>
    </div>

    <button
      onClick={logout}
      title="Logout"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '7px 12px',
        borderRadius: 10,
        border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.2)' : '#fecaca'}`,
        background: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f1f5f9',
        color: '#ef4444',
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        outline: 'none',
        transition: 'all 0.15s ease'
      }}
    >
      <LogOut size={14} />
      <span className="hide-on-mobile">Logout</span>
    </button>
  </div>
</header>

      {/* --- Main Workspace --- */}
      <main style={{
        flex: 1,
        width: '100%',
        maxWidth: 1380,
        margin: '0 auto',
        padding: '32px 36px 60px 36px',
        boxSizing: 'border-box'
      }}>

        {/* --- Metric Stats Strip --- */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 32
        }}>
          <div style={{
            background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.07)' : '#e2e8f0'}`,
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}>
              <FileText size={18} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>{metrics.totalNotes}</div>
              <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', fontWeight: 500 }}>Active Documents</div>
            </div>
          </div>

          <div style={{
            background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.07)' : '#e2e8f0'}`,
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>{metrics.totalSummaries}</div>
              <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', fontWeight: 500 }}>AI Synthesized</div>
            </div>
          </div>

          <div style={{
            background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.07)' : '#e2e8f0'}`,
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <ListTodo size={18} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
                {metrics.completedActions} / {metrics.totalActions}
              </div>
              <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', fontWeight: 500 }}>Tasks Completed</div>
            </div>
          </div>

          <div style={{
            background: isDark ? 'rgba(15, 23, 42, 0.6)' : '#ffffff',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.07)' : '#e2e8f0'}`,
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <TrendingUp size={18} />
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>{metrics.completionRate}%</div>
              <div style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', fontWeight: 500 }}>Execution Rate</div>
            </div>
          </div>
        </div>

        {/* --- Note  --- */}
        <div style={{
          background: isDark ? 'rgba(15, 23, 42, 0.7)' : '#ffffff',
          backdropFilter: 'blur(16px)',
          borderRadius: 20,
          border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
          padding: '24px 26px',
          marginBottom: 36,
          boxShadow: isDark
            ? '0 20px 40px -15px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            : '0 10px 30px -10px rgba(0, 0, 0, 0.04)'
        }}>
          <input
            ref={newNoteInputRef}
            type="text"
            placeholder="Give your note a sharp title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}`,
              backgroundColor: isDark ? 'rgba(8, 12, 22, 0.7)' : '#f8fafc',
              color: isDark ? '#ffffff' : '#0f172a',
              fontSize: 15,
              fontWeight: 600,
              outline: 'none',
              marginBottom: 12,
              boxSizing: 'border-box'
            }}
          />

          <textarea
            placeholder="Paste raw thoughts, meeting transcripts, or markdown notes here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: 12,
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}`,
              backgroundColor: isDark ? 'rgba(8, 12, 22, 0.7)' : '#f8fafc',
              color: isDark ? '#e2e8f0' : '#334155',
              fontSize: 14,
              lineHeight: 1.6,
              outline: 'none',
              marginBottom: 18,
              boxSizing: 'border-box',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={toggleRecording}
              className={isRecording ? 'recording-pulse' : ''}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '10px 18px',
                borderRadius: 10,
                border: isRecording ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.15)',
                background: isRecording
                  ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: isRecording
                  ? '0 4px 16px rgba(239, 68, 68, 0.4)'
                  : '0 4px 16px rgba(79, 70, 229, 0.35)'
              }}
            >
              {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
              <span>{isRecording ? 'Listening...' : 'Voice Dictate'}</span>
            </button>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button
                type="button"
                onClick={(e) => handleCreateNote(e, false)}
                disabled={isAiLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isAiLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 16px rgba(79, 70, 229, 0.35)'
                }}
              >
                <FileText size={15} />
                <span>Save Raw</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleCreateNote(e, true)}
                disabled={isAiLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 22px',
                  borderRadius: 10,
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  background: isAiLoading
                    ? '#4338ca'
                    : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isAiLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 16px rgba(79, 70, 229, 0.35)'
                }}
              >
                <Sparkles size={15} />
                <span>{isAiLoading ? 'Synthesizing...' : 'Analyze with AI'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* --- Search & Tags Filter Bar --- */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', minWidth: 280, flex: '1 1 320px' }}>
            <Search size={16} color={isDark ? '#64748b' : '#94a3b8'} style={{ position: 'absolute', left: 14, pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Filter notes by keyword, tag, or action item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: 12,
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                color: isDark ? '#ffffff' : '#0f172a',
                fontSize: 13,
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              onClick={() => setSelectedTag(null)}
              style={{
                padding: '6px 14px',
                borderRadius: 99,
                border: selectedTag === null ? '1px solid #6366f1' : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}`,
                background: selectedTag === null ? '#6366f1' : (isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff'),
                color: selectedTag === null ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              All Notes
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 14px',
                  borderRadius: 99,
                  border: selectedTag === tag ? '1px solid #6366f1' : `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}`,
                  background: selectedTag === tag ? '#6366f1' : (isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff'),
                  color: selectedTag === tag ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'),
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Tag size={11} /> {tag}
              </button>
            ))}
          </div>
        </div>

        {/* --- View Content--- */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 24 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-box" style={{ height: 280, borderRadius: 18, background: isDark ? 'rgba(15, 23, 42, 0.5)' : '#e2e8f0' }} />
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 24 }}>
            {filteredNotes.map(renderNoteCard)}
          </div>
        ) : (
          /* Kanban Board View */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ background: isDark ? 'rgba(15, 23, 42, 0.4)' : '#f1f5f9', padding: 18, borderRadius: 16, border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, marginBottom: 14, color: '#f59e0b' }}>
                <Circle size={15} />
                <span>Pending Action Items</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {filteredNotes.filter((n) => n.actionItems?.some((_, i) => !completedItems[`${n._id}-${i}`])).map(renderNoteCard)}
              </div>
            </div>

            <div style={{ background: isDark ? 'rgba(15, 23, 42, 0.4)' : '#f1f5f9', padding: 18, borderRadius: 16, border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, marginBottom: 14, color: '#10b981' }}>
                <CheckCircle2 size={15} />
                <span>All Items Completed</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {filteredNotes.filter((n) => n.actionItems?.length > 0 && n.actionItems.every((_, i) => completedItems[`${n._id}-${i}`])).map(renderNoteCard)}
              </div>
            </div>

            <div style={{ background: isDark ? 'rgba(15, 23, 42, 0.4)' : '#f1f5f9', padding: 18, borderRadius: 16, border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, marginBottom: 14, color: '#6366f1' }}>
                <FileText size={15} />
                <span>Reference Notes</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {filteredNotes.filter((n) => !n.actionItems || n.actionItems.length === 0).map(renderNoteCard)}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- Footer --- */}
      <footer style={{
        width: '100%',
        background: isDark ? 'rgba(8, 12, 22, 0.95)' : '#ffffff',
        borderTop: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : '#e2e8f0'}`,
        padding: '22px 36px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          maxWidth: 1380,
          margin: '0 auto',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: isDark ? '#ffffff' : '#0f172a' }}>
              Note<span style={{ color: '#6366f1' }}>AI</span>
            </span>
            <span style={{ fontSize: 12, color: isDark ? '#64748b' : '#94a3b8' }}>
              © 2026 NoteAI Studio
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontSize: 12, color: isDark ? '#64748b' : '#94a3b8', fontWeight: 500 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Cpu size={14} color="#6366f1" />
              <span>Gemini 3.6 Flash</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <ShieldCheck size={14} color="#10b981" />
              <span>AES-256 JWT</span>
            </span>
          </div>

          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 99,
            background: isDark ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5',
            color: '#10b981',
            border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.2)' : '#a7f3d0'}`
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
            Operational
          </span>
        </div>
      </footer>

      {/* --- Toast Container --- */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none'
      }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 18px',
              borderRadius: 12,
              background: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${toast.type === 'error' ? '#ef4444' : (toast.type === 'info' ? '#3b82f6' : '#10b981')}`,
              color: isDark ? '#ffffff' : '#0f172a',
              fontSize: 13,
              fontWeight: 600,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)'
            }}
          >
            {toast.type === 'error' ? (
              <AlertCircle size={16} color="#ef4444" />
            ) : toast.type === 'info' ? (
              <Info size={16} color="#3b82f6" />
            ) : (
              <CheckCircle2 size={16} color="#10b981" />
            )}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* --- Command Palette Modal (Cmd + K) --- */}
      {isCommandOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '15vh'
        }} onClick={() => setIsCommandOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 580,
              background: isDark ? '#0e1422' : '#ffffff',
              border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0'}`,
              borderRadius: 18,
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
              overflow: 'hidden'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '14px 18px',
              borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0'}`,
              gap: 12
            }}>
              <Search size={18} color="#6366f1" />
              <input
                autoFocus
                type="text"
                placeholder="Search notes, jump to tag, or press Esc to exit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  fontSize: 15,
                  color: isDark ? '#ffffff' : '#0f172a',
                  fontFamily: 'inherit'
                }}
              />
              <button
                onClick={() => setIsCommandOpen(false)}
                style={{ background: 'none', border: 'none', color: isDark ? '#64748b' : '#94a3b8', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ maxHeight: 320, overflowY: 'auto', padding: '10px 12px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: isDark ? '#64748b' : '#94a3b8', padding: '6px 8px' }}>
                Quick Actions
              </div>
              <div
                onClick={() => {
                  setIsCommandOpen(false);
                  newNoteInputRef.current?.focus();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 13,
                  color: isDark ? '#e2e8f0' : '#1e293b'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(99, 102, 241, 0.15)' : '#f1f5f9')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Sparkles size={15} color="#6366f1" />
                <span>Focus Note Creator</span>
              </div>

              {allTags.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: isDark ? '#64748b' : '#94a3b8', padding: '12px 8px 6px 8px' }}>
                    Filter by Tag
                  </div>
                  {allTags.map((tag) => (
                    <div
                      key={tag}
                      onClick={() => {
                        setSelectedTag(tag);
                        setIsCommandOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '9px 12px',
                        borderRadius: 10,
                        cursor: 'pointer',
                        fontSize: 13,
                        color: isDark ? '#e2e8f0' : '#1e293b'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = isDark ? 'rgba(99, 102, 241, 0.15)' : '#f1f5f9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Tag size={13} color="#6366f1" /> {tag}
                      </span>
                      <kbd style={{ fontSize: 10, opacity: 0.6 }}>Filter</kbd>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}