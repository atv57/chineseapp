const { useState, useEffect, useCallback, useMemo, useRef, useReducer } = React;

// ─── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'hanzistudy_v1';
const defaultData = { characters: [], wordLists: [], quizStats: {}, practiceStats: {}, srsData: {}, studyLog: {} };

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultData, ...JSON.parse(raw) };
  } catch {}
  return defaultData;
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ─── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_CHAR':
      return { ...state, characters: [action.data, ...state.characters] };
    case 'UPDATE_CHAR':
      return {
        ...state,
        characters: state.characters.map(c => c.id === action.id ? { ...c, ...action.data } : c),
      };
    case 'DELETE_CHAR':
      return { ...state, characters: state.characters.filter(c => c.id !== action.id) };
    case 'BULK_ADD':
      return { ...state, characters: [...action.entries, ...state.characters] };
    case 'ADD_LIST':
      return { ...state, wordLists: [...state.wordLists, action.data] };
    case 'UPDATE_LIST':
      return {
        ...state,
        wordLists: state.wordLists.map(wl => wl.id === action.id ? { ...wl, name: action.name } : wl),
      };
    case 'DELETE_LIST':
      return {
        ...state,
        wordLists: state.wordLists.filter(wl => wl.id !== action.id),
        characters: state.characters.map(c => ({
          ...c, wordListIds: c.wordListIds.filter(id => id !== action.id),
        })),
      };
    case 'IMPORT':
      return { ...defaultData, ...action.data };
    case 'UPDATE_QUIZ_STATS': {
      const stats = { ...(state.quizStats || {}) };
      action.results.forEach(({ charId, correct }) => {
        const prev = stats[charId] || { correct: 0, incorrect: 0 };
        stats[charId] = {
          correct: prev.correct + (correct ? 1 : 0),
          incorrect: prev.incorrect + (correct ? 0 : 1),
        };
      });
      return { ...state, quizStats: stats };
    }
    case 'UPDATE_PRACTICE_STATS': {
      const prev = (state.practiceStats || {})[action.charId] || { count: 0, totalMistakes: 0 };
      const todayP = dateKey(new Date());
      return {
        ...state,
        practiceStats: {
          ...(state.practiceStats || {}),
          [action.charId]: {
            count: prev.count + 1,
            totalMistakes: prev.totalMistakes + action.mistakes,
            lastPracticed: Date.now(),
          },
        },
        studyLog: { ...(state.studyLog || {}), [todayP]: ((state.studyLog || {})[todayP] || 0) + 1 },
      };
    }
    case 'UPDATE_SRS': {
      const SRS_INTERVALS_MS = [0, 1, 3, 7, 14, 30].map(d => d * 86400000);
      const now = Date.now();
      const cur = (state.srsData || {})[action.charId] || { box: 1, nextReview: 0, totalReviews: 0 };
      const newBox = action.correct ? Math.min(5, (cur.box || 1) + 1) : 1;
      const todayS = dateKey(new Date());
      return {
        ...state,
        srsData: {
          ...(state.srsData || {}),
          [action.charId]: {
            box: newBox,
            nextReview: now + SRS_INTERVALS_MS[newBox],
            lastReviewed: now,
            totalReviews: (cur.totalReviews || 0) + 1,
          },
        },
        studyLog: { ...(state.studyLog || {}), [todayS]: ((state.studyLog || {})[todayS] || 0) + 1 },
      };
    }
    default:
      return state;
  }
}

// ─── Icons ─────────────────────────────────────────────────────────────────────

const Icon = ({ d, size = 'w-5 h-5', ...rest }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" strokeLinejoin="round" className={size} {...rest}>
    {Array.isArray(d) ? d.map((p, i) => <path key={i} d={p} />) : <path d={d} />}
  </svg>
);

const BookIcon = () => <Icon size="w-6 h-6" d={["M4 19.5A2.5 2.5 0 0 1 6.5 17H20","M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"]} />;
const PracticeIcon = () => <Icon size="w-6 h-6" d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />;
const StatsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
  </svg>
);
const QuizIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const XIcon = ({ size = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={size}>
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
);
const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <circle cx="3" cy="6" r="0.5" fill="currentColor"/>
    <circle cx="3" cy="12" r="0.5" fill="currentColor"/>
    <circle cx="3" cy="18" r="0.5" fill="currentColor"/>
  </svg>
);
const ChevronIcon = ({ open }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
    className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const MoonIcon = () => <Icon d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />;
const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const ArrowLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
  </svg>
);
const KeyboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <rect x="2" y="6" width="20" height="12" rx="2"/>
    <line x1="6" y1="10" x2="6.01" y2="10"/><line x1="10" y1="10" x2="10.01" y2="10"/>
    <line x1="14" y1="10" x2="14.01" y2="10"/><line x1="18" y1="10" x2="18.01" y2="10"/>
    <line x1="8" y1="14" x2="16" y2="14"/>
  </svg>
);

// ─── Modal ─────────────────────────────────────────────────────────────────────

function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative z-10 w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh]`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <XIcon />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Field ─────────────────────────────────────────────────────────────────────

function Field({ label, hint, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow";

// ─── Character Modal ───────────────────────────────────────────────────────────

function CharacterModal({ initial, wordLists, allCharacters, onSave, onClose }) {
  const [form, setForm] = useState({
    character: initial?.character ?? '',
    pinyin: initial?.pinyin ?? '',
    meaning: initial?.meaning ?? '',
    wordListIds: initial?.wordListIds ?? [],
    componentIds: initial?.componentIds ?? [],
    isWord: initial?.isWord ?? false,
  });
  const [errors, setErrors] = useState({});
  const [compQuery, setCompQuery] = useState('');

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  useEffect(() => {
    if (form.character.length > 1 && !form.isWord)
      setForm(f => ({ ...f, isWord: true }));
  }, [form.character]);

  const toggleId = (key, val) => setForm(f => ({
    ...f,
    [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val],
  }));

  const validate = () => {
    const e = {};
    if (!form.character.trim()) e.character = 'Required';
    if (!form.pinyin.trim()) e.pinyin = 'Required';
    if (!form.meaning.trim()) e.meaning = 'Required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = () => { if (validate()) onSave(form); };

  const singleChars = allCharacters.filter(c => !c.isWord && c.id !== initial?.id);
  const availComponents = useMemo(() => {
    const q = compQuery.toLowerCase();
    if (!q) return singleChars;
    return singleChars.filter(c =>
      c.character.includes(q) || c.pinyin.toLowerCase().includes(q) || c.meaning.toLowerCase().includes(q)
    );
  }, [singleChars, compQuery]);

  const selectedComponents = allCharacters.filter(c => form.componentIds.includes(c.id));

  return (
    <Modal title={initial ? 'Edit Entry' : 'Add Entry'} onClose={onClose}>
      <div className="space-y-5">
        <Field label="字符 Character" error={errors.character}>
          <div className="relative">
            <input type="text" value={form.character} onChange={set('character')} placeholder="你好"
              className={`${inputCls} text-3xl font-bold text-center tracking-widest`} />
            {form.isWord && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                词语
              </span>
            )}
          </div>
          {form.character.length > 1 && (
            <label className="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
              <input type="checkbox" checked={form.isWord}
                onChange={e => setForm(f => ({ ...f, isWord: e.target.checked }))}
                className="accent-indigo-600" />
              Mark as multi-character word (词语)
            </label>
          )}
        </Field>

        <Field label="拼音 Pīnyīn" error={errors.pinyin}
          hint="Use tone marks: ā á ǎ à · ē é ě è · ī í ǐ ì · ō ó ǒ ò · ū ú ǔ ù">
          <input type="text" value={form.pinyin} onChange={set('pinyin')} placeholder="nǐ hǎo" className={inputCls} />
        </Field>

        <Field label="English Meaning" error={errors.meaning}>
          <input type="text" value={form.meaning} onChange={set('meaning')} placeholder="hello" className={inputCls} />
        </Field>

        {wordLists.length > 0 && (
          <Field label="Word Lists">
            <div className="flex flex-wrap gap-2">
              {wordLists.map(wl => (
                <button key={wl.id} type="button" onClick={() => toggleId('wordListIds', wl.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    form.wordListIds.includes(wl.id)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}>
                  {wl.name}
                </button>
              ))}
            </div>
          </Field>
        )}

        {form.isWord && singleChars.length > 0 && (
          <Field label="Component Characters" hint="Link individual characters that make up this word">
            {selectedComponents.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedComponents.map(c => (
                  <span key={c.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 rounded-xl text-sm">
                    <span className="font-bold text-base">{c.character}</span>
                    <span className="text-indigo-500 text-xs">{c.pinyin}</span>
                    <button onClick={() => toggleId('componentIds', c.id)}
                      className="ml-0.5 text-indigo-400 hover:text-red-500 transition-colors">
                      <XIcon size="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <input type="text" value={compQuery} onChange={e => setCompQuery(e.target.value)}
              placeholder="Search to add..." className={`${inputCls} text-sm mb-2`} />
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
              {availComponents.slice(0, 40).map(c => (
                <button key={c.id} type="button" onClick={() => toggleId('componentIds', c.id)}
                  title={`${c.pinyin} — ${c.meaning}`}
                  className={`px-2.5 py-1.5 rounded-xl text-sm font-bold transition-colors ${
                    form.componentIds.includes(c.id)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                  }`}>
                  {c.character}
                </button>
              ))}
            </div>
          </Field>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-medium shadow-lg shadow-indigo-600/25 transition-colors">
            {initial ? 'Save Changes' : 'Add'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Bulk Add Modal ────────────────────────────────────────────────────────────

function BulkAddModal({ wordLists, onSave, onClose }) {
  const [text, setText] = useState('');
  const [listIds, setListIds] = useState([]);

  const { parsed, errors } = useMemo(() => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const parsed = [], errors = [];
    lines.forEach((line, i) => {
      const parts = line.split('|').map(p => p.trim());
      if (parts.length < 3) { errors.push(`Line ${i+1}: need "字 | pīnyīn | meaning"`); return; }
      const [character, pinyin, meaning] = parts;
      if (!character || !pinyin || !meaning) { errors.push(`Line ${i+1}: all three fields required`); return; }
      parsed.push({ character, pinyin, meaning, isWord: character.length > 1 });
    });
    return { parsed, errors };
  }, [text]);

  const toggleList = (id) => setListIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleSave = () => {
    if (!parsed.length) return;
    onSave(parsed.map(p => ({ ...p, id: uid(), wordListIds: listIds, componentIds: [], createdAt: Date.now() })));
  };

  return (
    <Modal title="Bulk Add" onClose={onClose} wide>
      <div className="space-y-4">
        <Field label="Paste entries — one per line" hint='Format: 字 | pīnyīn | meaning'>
          <textarea rows={8} value={text} onChange={e => setText(e.target.value)}
            placeholder={"好 | hǎo | good\n坏 | huài | bad\n你好 | nǐ hǎo | hello"}
            className={`${inputCls} font-mono text-sm resize-none`} />
        </Field>

        {errors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-3 space-y-1">
            {errors.map((e, i) => <p key={i} className="text-xs text-red-600 dark:text-red-400">{e}</p>)}
          </div>
        )}

        {parsed.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {parsed.length} {parsed.length === 1 ? 'entry' : 'entries'} ready
            </p>
            <div className="max-h-36 overflow-y-auto space-y-1 rounded-2xl border border-gray-100 dark:border-gray-800 p-2">
              {parsed.map((p, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-xl text-sm">
                  <span className="font-bold text-gray-900 dark:text-gray-100 text-base w-12 text-center">{p.character}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 flex-shrink-0">{p.pinyin}</span>
                  <span className="text-gray-500 truncate">{p.meaning}</span>
                  {p.isWord && <span className="ml-auto flex-shrink-0 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 px-1.5 rounded-full">词</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {wordLists.length > 0 && (
          <Field label="Add to word lists (optional)">
            <div className="flex flex-wrap gap-2">
              {wordLists.map(wl => (
                <button key={wl.id} type="button" onClick={() => toggleList(wl.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    listIds.includes(wl.id)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                  {wl.name}
                </button>
              ))}
            </div>
          </Field>
        )}

        <div className="flex gap-3 pt-1">
          <button onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} disabled={parsed.length === 0}
            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-medium shadow-lg shadow-indigo-600/25 transition-colors">
            Add {parsed.length > 0 ? parsed.length : ''} {parsed.length === 1 ? 'Entry' : 'Entries'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Word List Modal ───────────────────────────────────────────────────────────

function WordListModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) { setError('Name is required'); return; }
    onSave(name.trim());
  };

  return (
    <Modal title={initial ? 'Rename List' : 'New Word List'} onClose={onClose}>
      <div className="space-y-4">
        <Field label="List Name" error={error}>
          <input type="text" value={name} autoFocus
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="e.g. Week 3 vocab, Food, HSK 1..."
            className={inputCls} />
        </Field>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave}
            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-medium shadow-lg shadow-indigo-600/25 transition-colors">
            {initial ? 'Rename' : 'Create'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Character Card ────────────────────────────────────────────────────────────

function CharacterCard({ char, wordLists, allCharacters, onEdit, onDelete, confirmId, practiced, box, due }) {
  const [expanded, setExpanded] = useState(false);
  const lists = wordLists.filter(wl => char.wordListIds.includes(wl.id));
  const components = allCharacters.filter(c => (char.componentIds ?? []).includes(c.id));
  const isPendingDelete = confirmId === char.id;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border transition-colors overflow-hidden ${
      isPendingDelete ? 'border-red-400 dark:border-red-600' : 'border-gray-100 dark:border-gray-700'
    }`}>
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
        onClick={() => setExpanded(e => !e)}>
        <div className={`flex-shrink-0 w-14 h-14 relative flex items-center justify-center rounded-2xl transition-colors ${
          due ? 'bg-amber-50 dark:bg-amber-900/30 ring-2 ring-amber-300 dark:ring-amber-700' : 'bg-indigo-50 dark:bg-indigo-900/40'
        }`}>
          <span className={`font-bold leading-none ${
            char.character.length > 2 ? 'text-lg' : char.character.length > 1 ? 'text-2xl' : 'text-3xl'
          } ${due ? 'text-amber-700 dark:text-amber-300' : 'text-indigo-700 dark:text-indigo-300'}`}>
            {char.character}
          </span>
          {practiced && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
                <polyline points="1.5 5 3.5 7.5 8.5 2.5"/>
              </svg>
            </span>
          )}
          {box && (
            <span className={`absolute -bottom-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center text-white shadow-sm text-[9px] font-bold ${BOX_STYLE[box]?.ring ?? 'bg-gray-400'}`}>
              {box}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-indigo-500 dark:text-indigo-400">{char.pinyin}</span>
            {char.isWord && (
              <span className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 px-1.5 py-px rounded-full">词</span>
            )}
          </div>
          <p className="text-gray-700 dark:text-gray-300 text-sm leading-tight mt-0.5 truncate">{char.meaning}</p>
          {lists.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {lists.map(wl => (
                <span key={wl.id} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-px rounded-full">{wl.name}</span>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-0.5 ml-1 flex-shrink-0">
          <button onClick={e => { e.stopPropagation(); onEdit(char); }}
            className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl transition-colors">
            <EditIcon />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete(char.id); }}
            className={`p-2 rounded-xl transition-colors ${isPendingDelete
              ? 'text-red-600 bg-red-50 dark:bg-red-900/30'
              : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}>
            <TrashIcon />
          </button>
          <span className="text-gray-300 dark:text-gray-600 ml-1">
            <ChevronIcon open={expanded} />
          </span>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 pt-1 border-t border-gray-50 dark:border-gray-700/60 space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Full Meaning</p>
            <p className="text-gray-800 dark:text-gray-200 text-sm">{char.meaning}</p>
          </div>
          {components.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Component Characters</p>
              <div className="flex flex-wrap gap-2">
                {components.map(c => (
                  <div key={c.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-2xl">
                    <span className="text-xl font-bold text-indigo-700 dark:text-indigo-300">{c.character}</span>
                    <div>
                      <div className="text-xs text-indigo-500">{c.pinyin}</div>
                      <div className="text-xs text-gray-500">{c.meaning}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400">Added {new Date(char.createdAt).toLocaleDateString()}</p>
        </div>
      )}
    </div>
  );
}

// ─── Word Lists Panel ──────────────────────────────────────────────────────────

function WordListsPanel({ wordLists, characters, onNew, onRename, onDelete }) {
  return (
    <div className="mx-4 mb-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Word Lists</span>
        <button onClick={onNew}
          className="flex items-center gap-1 text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
          <PlusIcon /> New
        </button>
      </div>
      {wordLists.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-2">No lists yet — create one to organize your characters.</p>
      ) : (
        <div className="space-y-1">
          {wordLists.map(wl => {
            const count = characters.filter(c => c.wordListIds.includes(wl.id)).length;
            return (
              <div key={wl.id} className="flex items-center justify-between py-1.5">
                <div>
                  <span className="text-sm text-gray-800 dark:text-gray-200 font-medium">{wl.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{count} {count === 1 ? 'entry' : 'entries'}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  <button onClick={() => onRename(wl)}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <EditIcon />
                  </button>
                  <button onClick={() => onDelete(wl)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <TrashIcon />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Library Tab ───────────────────────────────────────────────────────────────

function LibraryTab({ data, dispatch }) {
  const { characters, wordLists, practiceStats, srsData } = data;
  const [search, setSearch] = useState('');
  const [filterListId, setFilterListId] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [editingChar, setEditingChar] = useState(null);
  const [editingList, setEditingList] = useState(null);
  const [showLists, setShowLists] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const fileInputRef = useRef(null);
  const deleteTimerRef = useRef(null);

  const filtered = useMemo(() => characters.filter(c => {
    if (filterListId !== 'all' && !c.wordListIds.includes(filterListId)) return false;
    const q = search.toLowerCase();
    return !q || c.character.includes(q) || c.pinyin.toLowerCase().includes(q) || c.meaning.toLowerCase().includes(q);
  }), [characters, filterListId, search]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => b.createdAt - a.createdAt), [filtered]);

  const handleSaveChar = (form) => {
    if (editingChar) {
      dispatch({ type: 'UPDATE_CHAR', id: editingChar.id, data: form });
    } else {
      dispatch({ type: 'ADD_CHAR', data: { ...form, id: uid(), createdAt: Date.now() } });
    }
    setEditingChar(null);
    setShowAddModal(false);
  };

  const handleBulkSave = (entries) => {
    dispatch({ type: 'BULK_ADD', entries });
    setShowBulkModal(false);
  };

  const handleDeleteChar = (id) => {
    if (deleteConfirm === id) {
      clearTimeout(deleteTimerRef.current);
      dispatch({ type: 'DELETE_CHAR', id });
      setDeleteConfirm(null);
    } else {
      clearTimeout(deleteTimerRef.current);
      setDeleteConfirm(id);
      deleteTimerRef.current = setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const handleSaveList = (name) => {
    if (editingList) {
      dispatch({ type: 'UPDATE_LIST', id: editingList.id, name });
    } else {
      dispatch({ type: 'ADD_LIST', data: { id: uid(), name, createdAt: Date.now() } });
    }
    setEditingList(null);
    setShowListModal(false);
  };

  const handleDeleteList = (wl) => {
    if (!window.confirm(`Delete "${wl.name}"? Characters stay, just removed from this list.`)) return;
    dispatch({ type: 'DELETE_LIST', id: wl.id });
    if (filterListId === wl.id) setFilterListId('all');
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), {
      href: url, download: `hanzi-study-${new Date().toISOString().slice(0,10)}.json`
    });
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (!Array.isArray(parsed.characters) || !Array.isArray(parsed.wordLists))
          throw new Error('bad format');
        if (window.confirm(`Import ${parsed.characters.length} characters and ${parsed.wordLists.length} word lists?\n\nThis REPLACES all current data.`)) {
          dispatch({ type: 'IMPORT', data: parsed });
        }
      } catch {
        alert('Invalid file. Expected a JSON export from this app.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Library</h1>
            <p className="text-xs text-gray-400">{characters.length} {characters.length === 1 ? 'entry' : 'entries'}</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleExport} title="Export JSON"
              className="p-2.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
              <DownloadIcon />
            </button>
            <button onClick={() => fileInputRef.current?.click()} title="Import JSON"
              className="p-2.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
              <UploadIcon />
            </button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <SearchIcon />
          </div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search character, pīnyīn, or meaning..."
            className="w-full pl-11 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-2xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow" />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-0.5">
            {['all', ...wordLists.map(wl => wl.id)].map(id => {
              const label = id === 'all' ? 'All' : wordLists.find(wl => wl.id === id)?.name;
              const active = filterListId === id;
              return (
                <button key={id} onClick={() => setFilterListId(id)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    active ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}>
                  {label}
                </button>
              );
            })}
          </div>
          <button onClick={() => setShowLists(s => !s)}
            className={`flex-shrink-0 p-2 rounded-xl transition-colors ${
              showLists ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}>
            <ListIcon />
          </button>
        </div>
      </div>

      {showLists && (
        <WordListsPanel
          wordLists={wordLists}
          characters={characters}
          onNew={() => { setEditingList(null); setShowListModal(true); }}
          onRename={(wl) => { setEditingList(wl); setShowListModal(true); }}
          onDelete={handleDeleteList}
        />
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-2">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            {characters.length === 0 ? (
              <>
                <span className="text-7xl leading-none mb-5 select-none">字</span>
                <p className="text-base font-semibold text-gray-600 dark:text-gray-400">No characters yet</p>
                <p className="text-sm text-gray-400 mt-1">Tap <strong>Add</strong> or <strong>Bulk Add</strong> to get started</p>
              </>
            ) : (
              <>
                <span className="text-5xl mb-4">🔍</span>
                <p className="text-base font-semibold text-gray-600 dark:text-gray-400">No results</p>
                <p className="text-sm text-gray-400 mt-1">Try a different search or filter</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2 pb-2">
            {sorted.map(char => (
              <CharacterCard
                key={char.id}
                char={char}
                wordLists={wordLists}
                allCharacters={characters}
                onEdit={setEditingChar}
                onDelete={handleDeleteChar}
                confirmId={deleteConfirm}
                practiced={!!(practiceStats?.[char.id]?.count > 0)}
                box={srsData?.[char.id]?.box ?? null}
                due={isDue(srsData?.[char.id])}
              />
            ))}
          </div>
        )}
      </div>

      {deleteConfirm && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-red-600 text-white text-sm px-4 py-2 rounded-full shadow-lg z-40 pointer-events-none">
          Tap delete again to confirm
        </div>
      )}

      <div className="flex-shrink-0 px-4 py-3 flex gap-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
        <button onClick={() => setShowBulkModal(true)}
          className="flex-1 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-500 dark:text-gray-400 rounded-2xl hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
          Bulk Add
        </button>
        <button onClick={() => { setEditingChar(null); setShowAddModal(true); }}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-medium shadow-lg shadow-indigo-600/30 transition-colors">
          <PlusIcon /> Add
        </button>
      </div>

      {(showAddModal || editingChar) && (
        <CharacterModal
          initial={editingChar}
          wordLists={wordLists}
          allCharacters={characters}
          onSave={handleSaveChar}
          onClose={() => { setShowAddModal(false); setEditingChar(null); }}
        />
      )}
      {showBulkModal && (
        <BulkAddModal wordLists={wordLists} onSave={handleBulkSave} onClose={() => setShowBulkModal(false)} />
      )}
      {showListModal && (
        <WordListModal
          initial={editingList}
          onSave={handleSaveList}
          onClose={() => { setShowListModal(false); setEditingList(null); }}
        />
      )}
    </div>
  );
}

// ─── Quiz Utilities ────────────────────────────────────────────────────────────

function normalizePinyin(s) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getWrongOptions(questionChar, allChars, count) {
  const qListIds = questionChar.wordListIds || [];
  let pool = qListIds.length > 0
    ? allChars.filter(c => c.id !== questionChar.id && !c.wordListIds.some(id => qListIds.includes(id)))
    : allChars.filter(c => c.id !== questionChar.id);
  if (pool.length < count) pool = allChars.filter(c => c.id !== questionChar.id);
  return shuffle(pool).slice(0, count);
}

function buildQuizQuestions(pool, allChars, mode, count = 10) {
  const questions = shuffle(pool).slice(0, count);
  return questions.map(char => {
    if (mode === 'pinyin') return { charId: char.id, char };
    const wrongs = getWrongOptions(char, allChars, 3);
    const isCharPick = mode === 'char-pick';
    const correct = { id: char.id, display: isCharPick ? char.character : char.meaning, isCorrect: true };
    const options = shuffle([
      correct,
      ...wrongs.map(c => ({ id: c.id, display: isCharPick ? c.character : c.meaning, isCorrect: false })),
    ]);
    return { charId: char.id, char, options };
  });
}

// ─── SRS (Leitner) Utilities ──────────────────────────────────────────────────

// Review intervals in days per box (index = box number 1-5)
const SRS_INTERVALS = [0, 1, 3, 7, 14, 30];

const BOX_STYLE = {
  1: { ring: 'bg-red-500',     text: 'text-red-600 dark:text-red-400',     label: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' },
  2: { ring: 'bg-orange-500',  text: 'text-orange-600 dark:text-orange-400', label: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' },
  3: { ring: 'bg-amber-400',   text: 'text-amber-600 dark:text-amber-400',  label: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' },
  4: { ring: 'bg-blue-500',    text: 'text-blue-600 dark:text-blue-400',    label: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' },
  5: { ring: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', label: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' },
};

function isDue(srsEntry) {
  if (!srsEntry) return true; // new characters are always due
  return srsEntry.nextReview <= Date.now();
}

function getDueCharacters(characters, srsData) {
  return characters.filter(c => isDue((srsData || {})[c.id]));
}

function buildSmartPool(characters, srsData) {
  const now = Date.now();
  const due = getDueCharacters(characters, srsData);
  return [...due].sort((a, b) => {
    const da = (srsData || {})[a.id];
    const db = (srsData || {})[b.id];
    const boxA = da?.box ?? 1;
    const boxB = db?.box ?? 1;
    if (boxA !== boxB) return boxA - boxB;
    const overdueA = now - (da?.nextReview ?? now);
    const overdueB = now - (db?.nextReview ?? now);
    return overdueB - overdueA;
  });
}

function calcStreak(studyLog) {
  const log = studyLog || {};
  let d = new Date();
  if (!log[dateKey(d)]) d = new Date(d.getTime() - 86400000);
  let streak = 0;
  while (log[dateKey(d)]) { streak++; d = new Date(d.getTime() - 86400000); }
  return streak;
}

// ─── Tone Helper ───────────────────────────────────────────────────────────────

const TONE_ROWS = [
  ['ā','á','ǎ','à','ē','é','ě','è'],
  ['ī','í','ǐ','ì','ō','ó','ǒ','ò'],
  ['ū','ú','ǔ','ù','ǖ','ǘ','ǚ','ǜ'],
];

const TONE_ROW_LABELS = ['a · e', 'i · o', 'u · ü'];

function ToneHelper({ onInsert }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl p-3 border border-gray-100 dark:border-gray-700/60">
      <div className="flex items-center gap-2 mb-2">
        <KeyboardIcon />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Tone marks</span>
      </div>
      <div className="space-y-1.5">
        {TONE_ROWS.map((row, ri) => (
          <div key={ri} className="flex items-center gap-1">
            <span className="w-8 text-center text-xs text-gray-300 dark:text-gray-600 font-medium flex-shrink-0">
              {TONE_ROW_LABELS[ri]}
            </span>
            <div className="flex-1 grid grid-cols-8 gap-1">
              {row.map(char => (
                <button
                  key={char}
                  type="button"
                  onPointerDown={e => { e.preventDefault(); onInsert(char); }}
                  className="py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-300 active:scale-95 transition-all select-none">
                  {char}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Quiz Feedback Helpers ────────────────────────────────────────────────────

const CORRECT_EMOJIS = ['🎉','✨','🌟','💪','🔥','⭐','🎯','👏'];

// ─── Quiz Progress Bar ─────────────────────────────────────────────────────────

function QuizProgressBar({ current, total, onExit }) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="flex-shrink-0 px-4 pt-4 pb-3 space-y-2">
      <div className="flex items-center justify-between">
        <button onClick={onExit}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          <ArrowLeftIcon /> Exit
        </button>
        <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
          {current} / {total}
        </span>
      </div>
      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Pinyin Session ────────────────────────────────────────────────────────────

function PinyinSession({ question, questionIndex, total, onAnswer, onExit }) {
  const [answer, setAnswer] = useState('');
  const [phase, setPhase] = useState('input'); // 'input' | 'feedback'
  const [correct, setCorrect] = useState(false);
  const inputRef = useRef(null);
  const cursorRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    setAnswer('');
    setPhase('input');
    setCorrect(false);
    clearTimeout(timerRef.current);
    setTimeout(() => inputRef.current?.focus(), 80);
  }, [question.charId]);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  // Restore cursor after tone insertion
  useEffect(() => {
    if (cursorRef.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(cursorRef.current, cursorRef.current);
      cursorRef.current = null;
    }
  });

  const insertTone = (char) => {
    const input = inputRef.current;
    const start = input ? (input.selectionStart ?? answer.length) : answer.length;
    const end = input ? (input.selectionEnd ?? answer.length) : answer.length;
    const newVal = answer.slice(0, start) + char + answer.slice(end);
    cursorRef.current = start + 1;
    setAnswer(newVal);
    input?.focus();
  };

  const submit = () => {
    if (!answer.trim() || phase !== 'input') return;
    const isCorrect = normalizePinyin(answer) === normalizePinyin(question.char.pinyin);
    setCorrect(isCorrect);
    setPhase('feedback');
    if (isCorrect) {
      timerRef.current = setTimeout(() => advance(isCorrect, answer), 1200);
    }
  };

  const advance = (isCorr = correct, ans = answer) => {
    clearTimeout(timerRef.current);
    onAnswer({ charId: question.charId, correct: isCorr, userAnswer: ans, correctAnswer: question.char.pinyin });
  };

  const charSize = question.char.character.length > 2 ? 'text-5xl' : question.char.character.length > 1 ? 'text-6xl' : 'text-8xl';

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <QuizProgressBar current={questionIndex + 1} total={total} onExit={onExit} />

      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4">
        {/* Character display */}
        <div className="flex justify-center pt-2">
          <div
            style={phase === 'feedback' && correct ? { animation: 'pop 0.45s ease' } : undefined}
            className={`w-40 h-40 rounded-3xl flex items-center justify-center transition-all duration-300 ${
            phase === 'input'
              ? 'bg-indigo-50 dark:bg-indigo-900/30'
              : correct
                ? 'bg-green-100 dark:bg-green-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
          }`}>
            <span className={`${charSize} font-bold leading-none text-center px-2 ${
              phase === 'input'
                ? 'text-indigo-700 dark:text-indigo-300'
                : correct
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
            }`}>
              {question.char.character}
            </span>
          </div>
        </div>

        {/* Input area */}
        <div className="space-y-2">
          <p className="text-xs text-center text-gray-400 font-medium uppercase tracking-wide">Type the pīnyīn</p>
          <input
            ref={inputRef}
            type="text"
            value={answer}
            onChange={e => phase === 'input' && setAnswer(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            readOnly={phase === 'feedback'}
            placeholder="pīnyīn..."
            className={`w-full px-4 py-3.5 text-center text-xl rounded-2xl border-2 outline-none transition-all ${
              phase === 'input'
                ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-indigo-400 dark:focus:border-indigo-500 text-gray-900 dark:text-gray-100'
                : correct
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                  : 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 line-through'
            }`}
          />

          {/* Feedback message */}
          {phase === 'feedback' && (
            <div className={`text-center py-3 px-4 rounded-2xl ${
              correct ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
            }`}>
              {correct ? (
                <>
                  <div style={{ display: 'inline-block', animation: 'pop 0.5s cubic-bezier(0.36,0.07,0.19,0.97)' }}
                    className="text-4xl mb-1 leading-none">
                    {CORRECT_EMOJIS[questionIndex % CORRECT_EMOJIS.length]}
                  </div>
                  <p className="text-green-700 dark:text-green-300 font-bold text-lg">Correct!</p>
                </>
              ) : (
                <>
                  <p className="text-red-600 dark:text-red-400 text-sm mb-1">Correct answer:</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{question.char.pinyin}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{question.char.meaning}</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Tone helper */}
        {phase === 'input' && <ToneHelper onInsert={insertTone} />}

        {/* Action button */}
        <div className="pb-2">
          {phase === 'input' ? (
            <button
              onClick={submit}
              disabled={!answer.trim()}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-semibold text-lg shadow-lg shadow-indigo-600/25 transition-colors">
              Submit
            </button>
          ) : (
            <button
              onClick={() => advance()}
              className={`w-full py-4 text-white rounded-2xl font-semibold text-lg shadow-lg transition-colors ${
                correct
                  ? 'bg-green-600 hover:bg-green-700 shadow-green-600/25'
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/25'
              }`}>
              {questionIndex + 1 < total ? 'Next →' : 'See Results'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Recognition Session ───────────────────────────────────────────────────────

function RecognitionSession({ question, questionIndex, total, mode, onAnswer, onExit }) {
  const [selected, setSelected] = useState(null); // option object
  const timerRef = useRef(null);

  useEffect(() => {
    setSelected(null);
    clearTimeout(timerRef.current);
  }, [question.charId]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleSelect = (option) => {
    if (selected) return;
    setSelected(option);
    if (option.isCorrect) {
      timerRef.current = setTimeout(() => advance(option), 1100);
    }
  };

  const advance = (opt = selected) => {
    clearTimeout(timerRef.current);
    const correctOpt = question.options.find(o => o.isCorrect);
    onAnswer({
      charId: question.charId,
      correct: opt?.isCorrect ?? false,
      userAnswer: opt?.display ?? '',
      correctAnswer: correctOpt?.display ?? '',
    });
  };

  const isCharPick = mode === 'char-pick';
  const charSize = question.char.character.length > 2 ? 'text-3xl' : question.char.character.length > 1 ? 'text-4xl' : 'text-6xl';

  const optionStyle = (opt) => {
    if (!selected) return 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300 active:scale-95';
    if (opt.isCorrect) return 'bg-green-500 border-2 border-green-500 text-white scale-105 shadow-lg shadow-green-500/30';
    if (opt.id === selected.id) return 'bg-red-500 border-2 border-red-500 text-white';
    return 'bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 opacity-50';
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <QuizProgressBar current={questionIndex + 1} total={total} onExit={onExit} />

      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-5">
        {/* Prompt */}
        <div className="flex flex-col items-center text-center pt-3 pb-1">
          {isCharPick ? (
            // Show pinyin + meaning → pick character
            <div className="space-y-1">
              <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{question.char.pinyin}</p>
              <p className="text-lg text-gray-600 dark:text-gray-400">{question.char.meaning}</p>
              <p className="text-xs text-gray-400 mt-2 uppercase tracking-wide font-medium">Which character?</p>
            </div>
          ) : (
            // Show character → pick meaning
            <div className="space-y-2">
              <div className="w-36 h-36 rounded-3xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mx-auto">
                <span className={`${charSize} font-bold text-indigo-700 dark:text-indigo-300 leading-none`}>
                  {question.char.character}
                </span>
              </div>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">What does this mean?</p>
            </div>
          )}
        </div>

        {/* Options */}
        <div className={`grid gap-3 ${isCharPick ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {question.options.map(opt => (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt)}
              disabled={!!selected}
              className={`rounded-2xl py-4 px-4 font-semibold transition-all duration-200 ${
                isCharPick ? 'text-3xl' : 'text-base text-left leading-snug'
              } ${optionStyle(opt)}`}>
              {isCharPick ? (
                opt.display
              ) : (
                <span className="block">{opt.display}</span>
              )}
            </button>
          ))}
        </div>

        {/* Feedback + Next */}
        {selected && (
          <div className="pb-2" style={{ animation: 'slide-up 0.25s ease' }}>
            {selected.isCorrect ? (
              <div className="mb-3 text-center py-2">
                <div style={{ display: 'inline-block', animation: 'pop 0.5s cubic-bezier(0.36,0.07,0.19,0.97)' }}
                  className="text-4xl leading-none">
                  {CORRECT_EMOJIS[questionIndex % CORRECT_EMOJIS.length]}
                </div>
                <p className="text-green-600 dark:text-green-400 font-bold mt-1">Correct!</p>
              </div>
            ) : (
              <div className="mb-3 text-center py-3 px-4 bg-green-50 dark:bg-green-900/20 rounded-2xl">
                <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide font-medium">Correct answer</p>
                <p className={`font-bold text-green-700 dark:text-green-300 ${isCharPick ? 'text-3xl' : 'text-base'}`}>
                  {question.options.find(o => o.isCorrect)?.display}
                </p>
              </div>
            )}
            <button
              onClick={() => advance()}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold text-lg shadow-lg shadow-indigo-600/25 transition-colors">
              {questionIndex + 1 < total ? 'Next →' : 'See Results'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Confetti Burst ────────────────────────────────────────────────────────────

function ConfettiBurst() {
  const pieces = useMemo(() => {
    const colors = ['bg-indigo-400','bg-emerald-400','bg-amber-400','bg-pink-400','bg-purple-400','bg-cyan-400','bg-red-400','bg-yellow-400'];
    return Array.from({ length: 32 }, (_, i) => ({
      color: colors[i % colors.length],
      left: `${Math.round((i / 32) * 100)}%`,
      delay: `${(i * 0.045).toFixed(2)}s`,
      duration: `${(1.1 + (i % 6) * 0.18).toFixed(2)}s`,
      size: `${7 + (i % 5)}px`,
      isCircle: i % 3 !== 0,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {pieces.map((p, i) => (
        <div key={i}
          className={`absolute top-0 ${p.color} ${p.isCircle ? 'rounded-full' : 'rounded-sm'}`}
          style={{ left: p.left, width: p.size, height: p.size,
            animation: `confetti-fall ${p.duration} ${p.delay} ease-in forwards` }}
        />
      ))}
    </div>
  );
}

// ─── Quiz Summary ──────────────────────────────────────────────────────────────

function QuizSummary({ results, elapsed, mode, onRetry, onSetup }) {
  const correct = results.filter(r => r.correct).length;
  const total = results.length;
  const pct = Math.round((correct / total) * 100);
  const missed = results.filter(r => !r.correct);
  const isPerfect = pct === 100;

  const scoreColor = isPerfect ? 'text-amber-500 dark:text-amber-400'
    : pct >= 80 ? 'text-green-600 dark:text-green-400'
    : pct >= 50 ? 'text-amber-600 dark:text-amber-400'
    : 'text-red-600 dark:text-red-400';

  const ringColor = isPerfect ? 'stroke-amber-400'
    : pct >= 80 ? 'stroke-green-500'
    : pct >= 50 ? 'stroke-amber-500'
    : 'stroke-red-500';

  const encouragement = isPerfect
    ? { emoji: '🏆', text: 'Perfect score!', color: 'text-amber-600 dark:text-amber-400' }
    : pct >= 80
    ? { emoji: '🌟', text: 'Great work!', color: 'text-green-600 dark:text-green-400' }
    : pct >= 60
    ? { emoji: '💪', text: 'Good effort — keep going!', color: 'text-indigo-600 dark:text-indigo-400' }
    : { emoji: '📚', text: 'Keep at it — practice makes perfect!', color: 'text-gray-600 dark:text-gray-400' };

  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {isPerfect && <ConfettiBurst />}

      <div className={`flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 ${
        isPerfect ? 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/10' : ''
      }`}>
        <h2 className={`text-lg font-bold ${isPerfect ? 'text-amber-700 dark:text-amber-300' : 'text-gray-900 dark:text-gray-100'}`}>
          {isPerfect ? '🏆 Perfect Score!' : 'Session Complete'}
        </h2>
        <button onClick={onSetup} className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
          Change Mode
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Score ring + encouragement */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-28 h-28">
            <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor"
                className="text-gray-100 dark:text-gray-800" strokeWidth="10" />
              <circle cx="50" cy="50" r="40" fill="none" strokeWidth="10"
                className={ringColor} strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.7s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-extrabold leading-none ${scoreColor}`}>{correct}</span>
              <span className="text-xs text-gray-400 font-medium">of {total}</span>
            </div>
          </div>

          <div className="text-center">
            <div style={{ display: 'inline-block', animation: 'pop 0.55s ease' }} className="text-4xl leading-none mb-1">
              {encouragement.emoji}
            </div>
            <p className={`text-2xl font-extrabold ${scoreColor}`}>{pct}%</p>
            <p className={`text-sm font-semibold mt-0.5 ${encouragement.color}`}>{encouragement.text}</p>
            <p className="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
              <span>⏱</span> {formatTime(elapsed)}
              <span className="mx-1">·</span>
              <span>{mode === 'pinyin' ? 'Pīnyīn' : mode === 'char-pick' ? 'Char Recognition' : 'Meaning'}</span>
            </p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{correct}</p>
            <p className="text-xs text-green-600 dark:text-green-500 font-medium mt-0.5">Correct ✓</p>
          </div>
          <div className={`${total - correct === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'} rounded-2xl p-3 text-center`}>
            <p className={`text-2xl font-bold ${total - correct === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
              {total - correct}
            </p>
            <p className={`text-xs font-medium mt-0.5 ${total - correct === 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'}`}>
              {total - correct === 0 ? 'None missed 🎉' : 'Missed ✗'}
            </p>
          </div>
        </div>

        {/* Missed items */}
        {missed.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Review these ({missed.length}):
            </p>
            <div className="space-y-2">
              {missed.map((r, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl">
                  <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 flex-shrink-0 w-10 text-center leading-tight">
                    {r.char.character}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium text-indigo-500">{r.char.pinyin}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{r.char.meaning}</span>
                    </div>
                    {r.userAnswer && (
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span className="text-red-500 line-through">{r.userAnswer}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-green-600 dark:text-green-400 font-medium">{r.correctAnswer}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
        <button onClick={onSetup}
          className="flex-1 py-3.5 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          Change Mode
        </button>
        <button onClick={onRetry}
          className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-600/25 transition-colors">
          Quiz Again →
        </button>
      </div>
    </div>
  );
}

// ─── Quiz Setup ────────────────────────────────────────────────────────────────

function QuizSetup({ data, onStart }) {
  const { characters, wordLists, srsData } = data;
  const [mode, setMode] = useState('pinyin');
  const [filterListId, setFilterListId] = useState('all');

  const dueCount = useMemo(() => getDueCharacters(characters, srsData).length, [characters, srsData]);

  const pool = useMemo(() => {
    if (filterListId === 'smart') return buildSmartPool(characters, srsData);
    if (filterListId === 'all') return characters;
    return characters.filter(c => c.wordListIds.includes(filterListId));
  }, [characters, srsData, filterListId]);

  const questionCount = Math.min(10, pool.length);
  const needsRecognition = mode !== 'pinyin' && characters.length < 4;
  const canStart = pool.length >= 1 && !needsRecognition;

  const filterBtn = (id, label, count, accent) => {
    const active = filterListId === id;
    return (
      <button key={id} onClick={() => setFilterListId(id)}
        className={`flex-shrink-0 px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
          active
            ? accent ?? 'bg-indigo-600 text-white'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}>
        {label}
        {count != null && (
          <span className={`ml-1.5 text-xs ${active ? 'opacity-75' : 'text-gray-400'}`}>{count}</span>
        )}
      </button>
    );
  };

  const modeBtn = (id, label, sub) => (
    <button key={id} onClick={() => setMode(id)}
      className={`flex-1 px-3 py-3 rounded-2xl border-2 text-left transition-all ${
        mode === id
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}>
      <p className={`text-sm font-semibold ${mode === id ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-800 dark:text-gray-200'}`}>{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5 leading-snug">{sub}</p>}
    </button>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-5 pt-5 pb-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Quiz</h1>
        <p className="text-sm text-gray-400 mt-0.5">{characters.length} characters in library</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-5">
        {/* Due-for-review banner */}
        {dueCount > 0 && (
          <button onClick={() => setFilterListId('smart')}
            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 text-left transition-all ${
              filterListId === 'smart'
                ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                : 'border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/10 hover:border-amber-400'
            }`}>
            <span className="text-2xl leading-none">🔔</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                {dueCount} character{dueCount !== 1 ? 's' : ''} due for review
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Tap to run a Smart Review session</p>
            </div>
            {filterListId === 'smart' && (
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-200 dark:bg-amber-800 px-2 py-0.5 rounded-full">Selected</span>
            )}
          </button>
        )}

        {/* Quiz mode */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Quiz Mode</p>
          <div className="space-y-2">
            <div className="flex gap-2">
              {modeBtn('pinyin', 'Pīnyīn Quiz', 'See a character — type its pīnyīn with tones')}
            </div>
            <div className="flex gap-2">
              {modeBtn('char-pick', 'Char Recognition', 'See pīnyīn + meaning — pick the character')}
              {modeBtn('meaning-pick', 'Meaning Recognition', 'See a character — pick the English meaning')}
            </div>
          </div>
          {needsRecognition && (
            <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-xl">
              Recognition quiz needs at least 4 characters in your library.
            </p>
          )}
        </div>

        {/* Character source */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Quiz From</p>
          <div className="flex flex-wrap gap-2">
            {dueCount > 0 && filterBtn('smart', '⭐ Smart Review', dueCount, 'bg-amber-500 text-white')}
            {filterBtn('all', 'All characters')}
            {wordLists.map(wl =>
              filterBtn(wl.id, wl.name, characters.filter(c => c.wordListIds.includes(wl.id)).length)
            )}
          </div>
          {pool.length === 0 && (
            <p className="mt-3 text-sm text-gray-400">
              {filterListId === 'smart' ? 'No characters due — great work!' : 'No characters here. Go to Library to add some.'}
            </p>
          )}
        </div>

        {/* Leitner box legend (when Smart Review selected) */}
        {filterListId === 'smart' && pool.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wide">Leitner Boxes</p>
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {[1,2,3,4,5].map(b => {
                const count = characters.filter(c => ((data.srsData || {})[c.id]?.box ?? 1) === b).length;
                return (
                  <div key={b} className={`rounded-xl py-2 px-1 ${BOX_STYLE[b].label}`}>
                    <div className="text-lg font-bold leading-none">{count}</div>
                    <div className="text-[10px] mt-1 font-medium opacity-80">Box {b}</div>
                    <div className="text-[9px] opacity-60">{SRS_INTERVALS[b]}d</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Session info */}
        {pool.length > 0 && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl px-4 py-3">
            <p className="text-sm text-indigo-700 dark:text-indigo-300">
              <span className="font-bold">{questionCount}</span>{' '}
              {questionCount === 1 ? 'question' : 'questions'}
              {pool.length > 10 && ` · drawn from ${pool.length} ${filterListId === 'smart' ? 'due' : ''} characters`}
            </p>
          </div>
        )}
      </div>

      {/* Start */}
      <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={() => canStart && onStart(mode, filterListId, pool)}
          disabled={!canStart}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-600/25 transition-colors">
          {filterListId === 'smart' ? '⭐ Start Smart Review →' : 'Start Quiz →'}
        </button>
      </div>
    </div>
  );
}

// ─── Quiz Tab ──────────────────────────────────────────────────────────────────

function QuizTab({ data, dispatch }) {
  // phase: 'setup' | 'running' | 'summary'
  const [phase, setPhase] = useState('setup');
  const [session, setSession] = useState(null);
  // session: { mode, questions, currentIndex, results, startTime, filterListId }

  const startSession = (mode, filterListId, pool) => {
    const questions = buildQuizQuestions(pool, data.characters, mode, 10);
    setSession({ mode, questions, currentIndex: 0, results: [], startTime: Date.now(), filterListId });
    setPhase('running');
  };

  const handleAnswer = (result) => {
    dispatch({ type: 'UPDATE_SRS', charId: result.charId, correct: result.correct });
    const char = session.questions[session.currentIndex].char;
    const enriched = { ...result, char };
    const newResults = [...session.results, enriched];
    const nextIndex = session.currentIndex + 1;

    if (nextIndex >= session.questions.length) {
      dispatch({ type: 'UPDATE_QUIZ_STATS', results: newResults });
      setSession(s => ({ ...s, results: newResults }));
      setPhase('summary');
    } else {
      setSession(s => ({ ...s, currentIndex: nextIndex, results: newResults }));
    }
  };

  const handleRetry = () => {
    let pool;
    if (session.filterListId === 'smart') pool = buildSmartPool(data.characters, data.srsData);
    else if (session.filterListId === 'all') pool = data.characters;
    else pool = data.characters.filter(c => c.wordListIds.includes(session.filterListId));
    startSession(session.mode, session.filterListId, pool);
  };

  if (phase === 'setup' || !session) {
    return <QuizSetup data={data} onStart={startSession} />;
  }

  if (phase === 'summary') {
    return (
      <QuizSummary
        results={session.results}
        elapsed={Date.now() - session.startTime}
        mode={session.mode}
        onRetry={handleRetry}
        onSetup={() => setPhase('setup')}
      />
    );
  }

  // Running
  const question = session.questions[session.currentIndex];
  if (session.mode === 'pinyin') {
    return (
      <PinyinSession
        key={`${session.startTime}-${session.currentIndex}`}
        question={question}
        questionIndex={session.currentIndex}
        total={session.questions.length}
        onAnswer={handleAnswer}
        onExit={() => setPhase('setup')}
      />
    );
  }

  return (
    <RecognitionSession
      key={`${session.startTime}-${session.currentIndex}`}
      question={question}
      questionIndex={session.currentIndex}
      total={session.questions.length}
      mode={session.mode}
      onAnswer={handleAnswer}
      onExit={() => setPhase('setup')}
    />
  );
}

// ─── Practice Tab ─────────────────────────────────────────────────────────────

function useHanziWriter(character, darkMode) {
  const containerRef = useRef(null);
  const writerRef = useRef(null);
  const [status, setStatus] = useState('loading'); // loading|ready|animating|quiz|done|error
  const [mistakes, setMistakes] = useState(0);
  const [strokesDone, setStrokesDone] = useState(0);
  const [strokesTotal, setStrokesTotal] = useState(0);
  const onCompleteRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = '';
    setStatus('loading');
    setMistakes(0);
    setStrokesDone(0);
    setStrokesTotal(0);

    if (typeof HanziWriter === 'undefined') { setStatus('error'); return; }

    const writer = HanziWriter.create(el, character, {
      width: 280, height: 280, padding: 12,
      showCharacter: true, showOutline: true,
      showHintAfterMisses: 3, highlightOnComplete: true,
      strokeColor: darkMode ? '#a5b4fc' : '#4338ca',
      outlineColor: darkMode ? '#4b5563' : '#d1d5db',
      drawingColor: '#f59e0b',
      highlightColor: '#10b981',
      drawingWidth: 4,
      onLoadCharDataSuccess: () => setStatus('ready'),
      onLoadCharDataError: () => setStatus('error'),
    });
    writerRef.current = writer;
    return () => { if (el) el.innerHTML = ''; };
  }, [character, darkMode]);

  const animate = useCallback(() => {
    const w = writerRef.current;
    if (!w || !['ready', 'done'].includes(status)) return;
    setStatus('animating');
    w.animateCharacter({ onComplete: () => setStatus('ready') });
  }, [status]);

  const startQuiz = useCallback((onComplete) => {
    const w = writerRef.current;
    if (!w || status === 'loading' || status === 'error') return;
    try { w.cancelQuiz(); } catch {}
    onCompleteRef.current = onComplete;
    setStatus('quiz');
    setMistakes(0);
    setStrokesDone(0);
    setStrokesTotal(0);
    w.quiz({
      onMistake: () => setMistakes(m => m + 1),
      onCorrectStroke: (d) => { setStrokesDone(d.strokesCompleted); setStrokesTotal(d.totalStrokeCount); },
      onComplete: (summary) => { setStatus('done'); onCompleteRef.current?.(summary.totalMistakes); },
    });
  }, [status]);

  const reset = useCallback(() => {
    const w = writerRef.current;
    if (!w) return;
    try { w.cancelQuiz(); } catch {}
    try { w.showCharacter(); } catch {}
    setStatus('ready');
    setMistakes(0);
    setStrokesDone(0);
    setStrokesTotal(0);
  }, []);

  return { containerRef, status, mistakes, strokesDone, strokesTotal, animate, startQuiz, reset };
}

function HanziCanvas({ char, darkMode, onQuizComplete }) {
  const { containerRef, status, mistakes, strokesDone, strokesTotal, animate, startQuiz, reset } =
    useHanziWriter(char.character, darkMode);

  const statusText = {
    loading: null,
    error: null,
    ready: 'Tap Animate to preview stroke order, then Practice to trace.',
    animating: 'Watching stroke order…',
    quiz: strokesTotal > 0
      ? `Stroke ${strokesDone + 1} of ${strokesTotal} · ${mistakes} mistake${mistakes !== 1 ? 's' : ''}`
      : 'Trace each stroke in order…',
    done: mistakes === 0 ? '🎉 Perfect!' : `Done — ${mistakes} mistake${mistakes !== 1 ? 's' : ''}`,
  }[status];

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Canvas */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-gray-100 dark:border-gray-700 shadow-inner bg-white dark:bg-gray-800"
        style={{ width: 280, height: 280 }}>
        <div ref={containerRef} style={{ width: 280, height: 280 }} />
        {status === 'loading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Loading stroke data…</p>
          </div>
        )}
      </div>

      {/* Error */}
      {status === 'error' && (
        <div className="w-full text-center px-4 py-3 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-700">
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">No stroke data available</p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">HanziWriter doesn't have data for "{char.character}"</p>
        </div>
      )}

      {/* Status line */}
      {statusText && (
        <p className={`text-sm text-center leading-snug ${
          status === 'done' && mistakes === 0 ? 'text-green-600 dark:text-green-400 font-semibold' :
          status === 'done' ? 'text-indigo-600 dark:text-indigo-400 font-medium' :
          status === 'quiz' && mistakes > 0 ? 'text-amber-600 dark:text-amber-400' :
          'text-gray-400 dark:text-gray-500'
        }`}>{statusText}</p>
      )}

      {/* Controls */}
      {!['loading', 'error'].includes(status) && (
        <div className="flex gap-3 w-full">
          <button
            onClick={animate}
            disabled={!['ready', 'done'].includes(status)}
            className="flex-1 py-3 rounded-2xl border-2 border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-medium text-sm disabled:opacity-30 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">
            ▶ Animate
          </button>
          {status === 'quiz' ? (
            <button onClick={reset}
              className="flex-1 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              ↺ Reset
            </button>
          ) : (
            <button
              onClick={() => startQuiz(onQuizComplete)}
              disabled={status === 'animating' || status === 'loading'}
              className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm disabled:opacity-30 shadow-lg shadow-indigo-600/25 transition-colors">
              {status === 'done' ? '↺ Again' : '✏ Practice'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PracticePicker({ data, onPractice }) {
  const { characters, wordLists, practiceStats } = data;
  const [filterListId, setFilterListId] = useState('all');

  const singleChars = characters.filter(c => !c.isWord);
  const visible = filterListId === 'all'
    ? singleChars
    : singleChars.filter(c => c.wordListIds.includes(filterListId));

  const listName = wordLists.find(w => w.id === filterListId)?.name;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-4 pt-4 pb-3 space-y-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Practice</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Stroke-order tracing · {singleChars.length} character{singleChars.length !== 1 ? 's' : ''} available
          </p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
          {[{ id: 'all', name: 'All' }, ...wordLists].map(item => (
            <button key={item.id} onClick={() => setFilterListId(item.id)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filterListId === item.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}>
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {filterListId !== 'all' && visible.length > 0 && (
        <div className="flex-shrink-0 px-4 mb-1">
          <button onClick={() => onPractice(visible)}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-medium text-sm shadow-lg shadow-indigo-600/25 transition-colors">
            Practice all {visible.length} in "{listName}" sequentially →
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2">
        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <span className="text-6xl mb-3 select-none">字</span>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No characters yet</p>
            <p className="text-sm text-gray-400 mt-1">Add single characters in the Library tab</p>
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <p className="text-gray-400">No single characters in this list</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {visible.map(char => {
              const stats = practiceStats?.[char.id];
              const practiced = !!(stats?.count > 0);
              return (
                <button key={char.id} onClick={() => onPractice([char])}
                  className="relative flex flex-col items-center gap-1.5 p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md active:scale-95 transition-all">
                  {practiced && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <svg viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-2.5 h-2.5">
                        <polyline points="1.5 5 3.5 7.5 8.5 2.5"/>
                      </svg>
                    </span>
                  )}
                  <span className="text-3xl font-bold text-indigo-700 dark:text-indigo-300 leading-none pt-1">{char.character}</span>
                  <span className="text-xs text-indigo-500 dark:text-indigo-400 font-medium truncate w-full text-center">{char.pinyin}</span>
                  {practiced ? (
                    <span className="text-xs text-green-600 dark:text-green-500 font-medium">{stats.count}×</span>
                  ) : (
                    <span className="text-xs text-gray-300 dark:text-gray-600">—</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PracticeSession({ chars, darkMode, practiceStats, dispatch, onBack }) {
  const [index, setIndex] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const isSequential = chars.length > 1;
  const char = chars[index];
  const isLast = index === chars.length - 1;
  const charStats = practiceStats?.[char?.id];

  useEffect(() => { setQuizDone(false); }, [index]);

  const handleQuizComplete = (mistakes) => {
    dispatch({ type: 'UPDATE_PRACTICE_STATS', charId: char.id, mistakes });
    setQuizDone(true);
  };

  const goNext = () => {
    if (isLast) { onBack(); return; }
    setIndex(i => i + 1);
  };

  if (!char) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
          <ArrowLeftIcon /> {isSequential ? 'Exit' : 'Back'}
        </button>
        <div className="text-center">
          {isSequential ? (
            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{index + 1} / {chars.length}</span>
          ) : charStats?.count > 0 ? (
            <span className="text-xs text-gray-400">Practiced {charStats.count}×</span>
          ) : null}
        </div>
        <div className="w-16" />
      </div>

      {/* Sequential progress bar */}
      {isSequential && (
        <div className="flex-shrink-0 px-5 pt-2.5 pb-0">
          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${(index / chars.length) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col items-center gap-5">
        {/* Character info */}
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-1 leading-none">{char.character}</div>
          <div className="text-lg font-medium text-indigo-600 dark:text-indigo-400">{char.pinyin}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{char.meaning}</div>
        </div>

        {/* Canvas */}
        <HanziCanvas key={char.id} char={char} darkMode={darkMode} onQuizComplete={handleQuizComplete} />

        {/* Post-quiz navigation */}
        {quizDone && (
          <div className="w-full space-y-2 pb-2">
            {isSequential ? (
              <button onClick={goNext}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-600/25 transition-colors">
                {isLast ? '✓ Finish Session' : 'Next Character →'}
              </button>
            ) : (
              <button onClick={onBack}
                className="w-full py-3 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                ← Back to Library
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PracticeTab({ data, dispatch, darkMode }) {
  const [session, setSession] = useState(null);

  if (session) {
    return (
      <PracticeSession
        chars={session}
        darkMode={darkMode}
        practiceStats={data.practiceStats}
        dispatch={dispatch}
        onBack={() => setSession(null)}
      />
    );
  }
  return <PracticePicker data={data} onPractice={setSession} />;
}

// ─── Stats Tab ─────────────────────────────────────────────────────────────────

function StatCard({ value, label, sub, colorClass, emoji }) {
  return (
    <div className={`rounded-2xl p-4 ${colorClass}`}>
      <div className="text-2xl leading-none mb-2">{emoji}</div>
      <div className="text-3xl font-extrabold leading-none">{value}</div>
      <div className="text-sm font-semibold mt-1.5">{label}</div>
      <div className="text-xs opacity-70 mt-0.5">{sub}</div>
    </div>
  );
}

function SectionHeader({ title, emoji }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {emoji && <span className="text-base leading-none">{emoji}</span>}
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">{title}</h3>
    </div>
  );
}

function StudyHeatmap({ studyLog }) {
  const log = studyLog || {};
  const today = new Date();
  const todayStr = dateKey(today);
  const days = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(today.getTime() - (34 - i) * 86400000);
    const key = dateKey(d);
    return { key, count: log[key] || 0, label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) };
  });
  const maxCount = Math.max(...days.map(d => d.count), 1);
  const cellColor = (count, isToday) => {
    const base = isToday ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 ' : '';
    if (!count) return base + 'bg-gray-100 dark:bg-gray-800';
    const f = count / maxCount;
    if (f < 0.25) return base + 'bg-indigo-200 dark:bg-indigo-900';
    if (f < 0.6)  return base + 'bg-indigo-400 dark:bg-indigo-700';
    return base + 'bg-indigo-600 dark:bg-indigo-500';
  };
  const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  return (
    <div>
      <div className="flex gap-1 mb-1.5">
        {DAY_LABELS.map(l => (
          <div key={l} className="flex-1 text-center text-[9px] text-gray-400 font-medium">{l}</div>
        ))}
      </div>
      <div className="space-y-1">
        {Array.from({ length: 5 }, (_, row) => (
          <div key={row} className="flex gap-1">
            {days.slice(row * 7, row * 7 + 7).map((day, col) => (
              <div key={col}
                title={`${day.label}: ${day.count} review${day.count !== 1 ? 's' : ''}`}
                className={`flex-1 rounded-md transition-colors ${cellColor(day.count, day.key === todayStr)}`}
                style={{ height: '22px' }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-1.5 mt-2.5">
        <span className="text-[10px] text-gray-400">Less</span>
        {['bg-gray-100 dark:bg-gray-800','bg-indigo-200 dark:bg-indigo-900','bg-indigo-400 dark:bg-indigo-700','bg-indigo-600 dark:bg-indigo-500'].map((c, i) => (
          <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
        ))}
        <span className="text-[10px] text-gray-400">More</span>
      </div>
    </div>
  );
}

function StatsTab({ data }) {
  const { characters, srsData, quizStats, studyLog } = data;
  const total = characters.length;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-8">
        <span className="text-7xl mb-4 select-none">📊</span>
        <h2 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">No data yet</h2>
        <p className="text-gray-400 text-sm leading-relaxed">Add characters to your library and start quizzing to see your progress here.</p>
      </div>
    );
  }

  const mastered = characters.filter(c => (srsData?.[c.id]?.box ?? 1) >= 4).length;
  const masteryPct = total > 0 ? Math.round((mastered / total) * 100) : 0;
  const streak = calcStreak(studyLog);
  const dueCount = getDueCharacters(characters, srsData).length;

  const boxCounts = [1,2,3,4,5].map(b => ({
    box: b,
    count: characters.filter(c => (srsData?.[c.id]?.box ?? 1) === b).length,
  }));

  const reviewedChars = characters.filter(c =>
    (srsData?.[c.id]?.totalReviews ?? 0) > 0 || (quizStats?.[c.id]?.incorrect ?? 0) > 0
  );
  const weakest = [...reviewedChars]
    .sort((a, b) => {
      const boxA = srsData?.[a.id]?.box ?? 1;
      const boxB = srsData?.[b.id]?.box ?? 1;
      if (boxA !== boxB) return boxA - boxB;
      return (quizStats?.[b.id]?.incorrect ?? 0) - (quizStats?.[a.id]?.incorrect ?? 0);
    })
    .slice(0, 6);

  const totalReviews = Object.values(studyLog || {}).reduce((s, n) => s + n, 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-shrink-0 px-5 pt-5 pb-3">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Stats</h1>
        <p className="text-sm text-gray-400 mt-0.5">{totalReviews} total reviews</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-6">
        {/* Overview cards */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            value={total} label="Characters" sub="in library"
            colorClass="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
            emoji="字"
          />
          <StatCard
            value={`${masteryPct}%`} label="Mastered" sub={`${mastered} of ${total} in box 4–5`}
            colorClass="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
            emoji="🏆"
          />
          <StatCard
            value={streak} label={`Day streak`} sub={streak > 0 ? 'Keep studying daily!' : 'Study today to start!'}
            colorClass={streak >= 3
              ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
              : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}
            emoji={streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : streak > 0 ? '✨' : '💤'}
          />
          <StatCard
            value={dueCount} label="Due today" sub="characters for review"
            colorClass={dueCount > 0
              ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300'
              : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'}
            emoji={dueCount > 0 ? '🔔' : '✅'}
          />
        </div>

        {/* Mastery progress */}
        <div>
          <SectionHeader title="Mastery Progress" emoji="📈" />
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${masteryPct}%` }}
                />
              </div>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 w-10 text-right">{masteryPct}%</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-center">
              {boxCounts.map(({ box, count }) => (
                <div key={box} className={`rounded-xl py-2.5 ${BOX_STYLE[box].label}`}>
                  <div className="text-lg font-extrabold leading-none">{count}</div>
                  <div className="text-[10px] font-semibold mt-1 opacity-80">Box {box}</div>
                  <div className="text-[9px] opacity-60">{SRS_INTERVALS[box]}d</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Weakest characters */}
        <div>
          <SectionHeader title="Needs Practice" emoji="💪" />
          {weakest.length === 0 ? (
            <p className="text-sm text-gray-400 py-2 text-center">Take some quizzes to see which characters need the most work.</p>
          ) : (
            <div className="space-y-2">
              {weakest.map(c => {
                const box = srsData?.[c.id]?.box ?? 1;
                const incorrect = quizStats?.[c.id]?.incorrect ?? 0;
                const correct = quizStats?.[c.id]?.correct ?? 0;
                const totalQ = correct + incorrect;
                const accuracy = totalQ > 0 ? Math.round((correct / totalQ) * 100) : null;
                return (
                  <div key={c.id} className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 w-10 text-center leading-none flex-shrink-0">{c.character}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-medium text-indigo-500">{c.pinyin}</span>
                        <span className={`text-[10px] px-1.5 py-px rounded-full font-bold ${BOX_STYLE[box].label}`}>B{box}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{c.meaning}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {accuracy !== null ? (
                        <>
                          <p className={`text-sm font-bold ${accuracy < 50 ? 'text-red-600 dark:text-red-400' : accuracy < 80 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                            {accuracy}%
                          </p>
                          <p className="text-[10px] text-gray-400">{totalQ} tries</p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400">new</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Study heatmap */}
        <div>
          <SectionHeader title="Study Activity (last 5 weeks)" emoji="📅" />
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
            <StudyHeatmap studyLog={studyLog} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Placeholder Tabs ──────────────────────────────────────────────────────────

function PlaceholderTab({ emoji, name, blurb }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-10">
      <span className="text-7xl mb-5 select-none">{emoji}</span>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">{name}</h2>
      <p className="text-gray-400 leading-relaxed">{blurb}</p>
      <span className="mt-4 text-xs text-gray-300 dark:text-gray-600 uppercase tracking-wider font-semibold">Coming soon</span>
    </div>
  );
}

// ─── Bottom Nav ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'library',  label: 'Library',  Icon: BookIcon },
  { id: 'quiz',     label: 'Quiz',     Icon: QuizIcon },
  { id: 'practice', label: 'Practice', Icon: PracticeIcon },
  { id: 'stats',    label: 'Stats',    Icon: StatsIcon },
];

function BottomNav({ active, onChange }) {
  return (
    <nav className="flex-shrink-0 flex bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 safe-bottom">
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button key={id} onClick={() => onChange(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 pt-2.5 pb-2 transition-colors ${
              isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}>
            <Icon />
            <span className="text-xs font-medium">{label}</span>
            {isActive && <div className="w-4 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full -mb-0.5" />}
          </button>
        );
      })}
    </nav>
  );
}

// ─── App Root ──────────────────────────────────────────────────────────────────

function App() {
  const [data, dispatch] = useReducer(reducer, null, loadData);
  const [activeTab, setActiveTab] = useState('library');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('hanzistudy_dark');
    return saved !== null ? saved === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => { saveData(data); }, [data]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('hanzistudy_dark', darkMode);
  }, [darkMode]);

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto bg-gray-50 dark:bg-gray-950 relative">
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <span className="text-xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">汉字 Study</span>
        <button onClick={() => setDarkMode(d => !d)}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          {darkMode ? <SunIcon /> : <MoonIcon />}
        </button>
      </header>

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'library'  && <LibraryTab data={data} dispatch={dispatch} />}
        {activeTab === 'quiz'     && <QuizTab data={data} dispatch={dispatch} />}
        {activeTab === 'practice' && <PracticeTab data={data} dispatch={dispatch} darkMode={darkMode} />}
        {activeTab === 'stats'    && <StatsTab data={data} />}
      </div>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
