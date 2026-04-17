import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Loader2 } from 'lucide-react';

/**
 * Reusable inline edit cell component for stock tables
 * Used in PartnerStockTab and PartnerStoresPage Manage Stock modal
 */
const InlineEditCell = ({
  value,
  displayValue,
  onSave,
  type = 'number', // 'number' | 'currency'
  min = 0,
  step = type === 'currency' ? 0.01 : 1,
  className = '',
  title = 'Click to edit',
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = () => {
    if (disabled || isSaving) return;
    setEditValue(String(value));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditValue('');
  };

  const handleSave = async () => {
    if (!isEditing) return;
    
    const numValue = parseFloat(editValue) || 0;
    const finalValue = type === 'currency' ? numValue : Math.round(numValue);
    
    // If no change, just cancel
    if (finalValue === value) {
      cancelEditing();
      return;
    }

    setIsSaving(true);
    try {
      const success = await onSave(Math.max(min, finalValue));
      if (success) {
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1000);
      }
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
      cancelEditing();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  // Saving state
  if (isSaving) {
    return (
      <span className={`inline-flex items-center justify-end ${className} opacity-50`}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </span>
    );
  }

  // Editing state
  if (isEditing) {
    return (
      <div className="flex items-center justify-end gap-1">
        {type === 'currency' && <span className="text-slate-500 text-xs">₹</span>}
        <input
          ref={inputRef}
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          min={min}
          step={step}
          className="w-16 px-2 py-1 text-right text-sm bg-slate-700 border border-teal-500 rounded text-white focus:outline-none"
          disabled={isSaving}
        />
        {type === 'currency' && <span className="text-slate-500 text-xs">/u</span>}
        <button
          onClick={handleSave}
          className="p-1 text-teal-400 hover:text-teal-300 md:hidden"
          title="Save"
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          onClick={cancelEditing}
          className="p-1 text-slate-400 hover:text-slate-300 md:hidden"
          title="Cancel"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  // Normal/saved state
  return (
    <span
      onClick={startEditing}
      className={`cursor-pointer hover:underline transition-all duration-300 ${className} ${
        justSaved ? 'bg-teal-500/30 px-1 rounded' : ''
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:text-white'}`}
      title={disabled ? 'Cannot edit' : title}
    >
      {displayValue}
    </span>
  );
};

export default InlineEditCell;
