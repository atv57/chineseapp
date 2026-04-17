const { useState, useEffect, useCallback, useMemo, useRef, useReducer } = React;

// ─── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'hanzistudy_v1';
const defaultData = { characters: [], wordLists: [] };

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
      return action.data;
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
        <Field label="Paste entries — one per line"
          hint='Format: 字 | pīnyīn | meaning'>
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

function CharacterCard({ char, wordLists, allCharacters, onEdit, onDelete, confirmId }) {
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
        <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl">
          <span className={`font-bold text-indigo-700 dark:text-indigo-300 leading-none ${
            char.character.length > 2 ? 'text-lg' : char.character.length > 1 ? 'text-2xl' : 'text-3xl'
          }`}>{char.character}</span>
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
  const { characters, wordLists } = data;
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
      {/* Header */}
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

        {/* Search */}
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <SearchIcon />
          </div>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search character, pīnyīn, or meaning..."
            className="w-full pl-11 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-2xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow" />
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar">
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

      {/* Word Lists Panel */}
      {showLists && (
        <WordListsPanel
          wordLists={wordLists}
          characters={characters}
          onNew={() => { setEditingList(null); setShowListModal(true); }}
          onRename={(wl) => { setEditingList(wl); setShowListModal(true); }}
          onDelete={handleDeleteList}
        />
      )}

      {/* Character list */}
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
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete toast */}
      {deleteConfirm && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-red-600 text-white text-sm px-4 py-2 rounded-full shadow-lg z-40 pointer-events-none animate-pulse">
          Tap delete again to confirm
        </div>
      )}

      {/* Bottom action bar */}
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

      {/* Modals */}
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
      {/* App bar */}
      <header className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <span className="text-xl font-extrabold tracking-tight text-indigo-600 dark:text-indigo-400">汉字 Study</span>
        <button onClick={() => setDarkMode(d => !d)}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          {darkMode ? <SunIcon /> : <MoonIcon />}
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'library'  && <LibraryTab data={data} dispatch={dispatch} />}
        {activeTab === 'quiz'     && <PlaceholderTab emoji="🃏" name="Quiz" blurb="Flashcard-style quizzes to test your recall — choose a word list and go." />}
        {activeTab === 'practice' && <PlaceholderTab emoji="✏️" name="Practice" blurb="Stroke-order practice and writing drills to build muscle memory." />}
        {activeTab === 'stats'    && <PlaceholderTab emoji="📊" name="Stats" blurb="Track your daily study streak, quiz accuracy, and progress over time." />}
      </div>

      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
