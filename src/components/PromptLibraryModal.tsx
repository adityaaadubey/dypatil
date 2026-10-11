import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Copy, 
  Check, 
  Play, 
  Plus, 
  BookOpen
} from 'lucide-react';
import { INITIAL_SAMPLE_PROMPTS } from '../data/samplePrompts';
import type { SamplePromptItem, PromptCategory } from '../types/modelExplorer';

interface PromptLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: SamplePromptItem) => void;
}

export const PromptLibraryModal: React.FC<PromptLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt
}) => {
  const [prompts, setPrompts] = useState<SamplePromptItem[]>(INITIAL_SAMPLE_PROMPTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New custom prompt form state
  const [isAddingCustom, setIsAddingCustom] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<PromptCategory>('coding');
  const [newPromptText, setNewPromptText] = useState('');
  const [newCriteria, setNewCriteria] = useState('');

  const categories = [
    { id: 'all', label: 'All Prompts' },
    { id: 'coding', label: 'Coding' },
    { id: 'reasoning', label: 'Reasoning' },
    { id: 'mathematics', label: 'Mathematics' },
    { id: 'writing', label: 'Writing & Summary' },
    { id: 'factual_qa', label: 'Factual QA' },
    { id: 'long_context', label: 'Long Context' },
    { id: 'creative', label: 'Creative' },
    { id: 'multilingual', label: 'Multilingual' },
    { id: 'instruction_following', label: 'Instruction Following' },
    { id: 'vision', label: 'Vision & Multimodal' }
  ];

  const filteredPrompts = useMemo(() => {
    return prompts.filter((p) => {
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const matchesSearch = 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.evaluationCriteria.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [prompts, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPromptText.trim()) return;

    const customPrompt: SamplePromptItem = {
      id: 'custom-' + Date.now().toString(36),
      title: newTitle.trim(),
      category: newCategory,
      difficulty: 'intermediate',
      prompt: newPromptText.trim(),
      evaluationCriteria: newCriteria.trim() || 'Custom user criteria.',
      expectedOutputFormat: 'Direct output',
      suggestedMaxTokens: 512,
      goodAnswerDescription: 'Adheres to custom constraints.',
      isCustom: true
    };

    setPrompts([customPrompt, ...prompts]);
    setIsAddingCustom(false);
    setNewTitle('');
    setNewPromptText('');
    setNewCriteria('');
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(5, 10, 24, 0.85)',
      backdropFilter: 'blur(8px)',
      zIndex: 150,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '920px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-card)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--accent-purple-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BookOpen size={18} color="var(--accent-purple)" />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Neutral Test Prompt Library
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Carefully written test cases with rigorous evaluation criteria across 10 domains
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsAddingCustom(!isAddingCustom)}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              <Plus size={13} />
              <span>{isAddingCustom ? 'Cancel' : 'Add Custom Prompt'}</span>
            </button>
            <button
              onClick={onClose}
              className="btn-ghost"
              style={{ padding: '6px', borderRadius: '50%' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Custom Prompt Form Drawer */}
        {isAddingCustom && (
          <form
            onSubmit={handleCreateCustom}
            style={{
              padding: '16px 24px',
              backgroundColor: 'var(--bg-card)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px' }}>
              <input
                type="text"
                placeholder="Prompt Title (e.g. Test SQL Injection Defense)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '12px'
                }}
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as PromptCategory)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                  fontSize: '12px'
                }}
              >
                {categories.filter((c) => c.id !== 'all').map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <textarea
              placeholder="Enter exact test prompt text..."
              value={newPromptText}
              onChange={(e) => setNewPromptText(e.target.value)}
              rows={3}
              required
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setIsAddingCustom(false)}
                className="btn-ghost"
                style={{ fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                style={{ padding: '6px 16px', fontSize: '12px' }}
              >
                Save Custom Prompt
              </button>
            </div>
          </form>
        )}

        {/* Category Filters Bar */}
        <div style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-main)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto'
        }}>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              style={{
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: selectedCategory === c.id ? 700 : 500,
                borderRadius: 'var(--radius-full)',
                backgroundColor: selectedCategory === c.id ? 'var(--accent-purple)' : 'var(--bg-panel)',
                color: selectedCategory === c.id ? '#FFFFFF' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input
              type="text"
              placeholder="Search prompts by keyword or criteria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-input)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '12px'
              }}
            />
          </div>
        </div>

        {/* Prompt Cards Grid */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '20px 24px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '16px',
          backgroundColor: 'var(--bg-main)'
        }}>
          {filteredPrompts.map((p) => (
            <div
              key={p.id}
              style={{
                backgroundColor: 'var(--bg-panel)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="badge badge-purple" style={{ fontSize: '9px', textTransform: 'uppercase' }}>
                      {p.category}
                    </span>
                    <span className="badge" style={{ fontSize: '9px', backgroundColor: 'var(--bg-pill)' }}>
                      {p.difficulty}
                    </span>
                    {p.requiresDocumentOrImage && (
                      <span className="badge badge-amber" style={{ fontSize: '9px' }}>
                        Image/Doc Input
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleCopy(p.id, p.prompt)}
                    className="btn-ghost"
                    style={{ padding: '4px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="Copy prompt text"
                  >
                    {copiedId === p.id ? <Check size={12} color="var(--accent-mint)" /> : <Copy size={12} />}
                    <span>{copiedId === p.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                  {p.title}
                </h4>

                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-primary)',
                  backgroundColor: 'var(--bg-card)',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  fontFamily: 'monospace',
                  lineHeight: 1.5,
                  maxHeight: '110px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '10px'
                }}>
                  {p.prompt}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--text-muted)' }}>Evaluation Criteria: </strong>
                  {p.evaluationCriteria}
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '10px'
              }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  Max tokens: {p.suggestedMaxTokens}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    onSelectPrompt(p);
                    onClose();
                  }}
                  className="btn-primary"
                  style={{ padding: '6px 14px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Play size={11} />
                  <span>Use in Comparison</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
