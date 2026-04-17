import React from 'react';
import { X, AlertTriangle, Trash2, AlertCircle } from 'lucide-react';

/**
 * Reusable Confirmation Modal Component
 * 
 * Usage:
 * <ConfirmationModal
 *   isOpen={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Item"
 *   message="Are you sure you want to delete this item?"
 *   itemName="My Item Name"
 *   warning="This action cannot be undone."
 *   confirmText="Delete"
 *   confirmColor="red"  // red, yellow, blue, green
 *   icon="trash"        // trash, alert, warning
 * />
 */

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  itemName = "",
  warning = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "red",
  icon = "trash",
  isLoading = false
}) => {
  if (!isOpen) return null;

  // Icon mapping
  const IconComponent = {
    trash: Trash2,
    alert: AlertCircle,
    warning: AlertTriangle
  }[icon] || Trash2;

  // Button color classes
  const confirmButtonClasses = {
    red: "bg-red-500 hover:bg-red-600 focus:ring-red-500",
    yellow: "bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500",
    blue: "bg-blue-500 hover:bg-blue-600 focus:ring-blue-500",
    green: "bg-green-500 hover:bg-green-600 focus:ring-green-500",
    purple: "bg-purple-500 hover:bg-purple-600 focus:ring-purple-500"
  }[confirmColor] || "bg-red-500 hover:bg-red-600 focus:ring-red-500";

  // Icon background color
  const iconBgClasses = {
    red: "bg-red-500/20",
    yellow: "bg-yellow-500/20",
    blue: "bg-blue-500/20",
    green: "bg-green-500/20",
    purple: "bg-purple-500/20"
  }[confirmColor] || "bg-red-500/20";

  const iconColorClasses = {
    red: "text-red-400",
    yellow: "text-yellow-400",
    blue: "text-blue-400",
    green: "text-green-400",
    purple: "text-purple-400"
  }[confirmColor] || "text-red-400";

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4"
      onClick={handleBackdropClick}
      data-testid="confirmation-modal-backdrop"
    >
      <div 
        className="bg-slate-800 rounded-xl w-full max-w-md border border-slate-700 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        data-testid="confirmation-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${iconBgClasses}`}>
              <IconComponent className={`w-5 h-5 ${iconColorClasses}`} />
            </div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
            data-testid="confirmation-modal-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-slate-300 text-sm leading-relaxed">
            {message}
          </p>
          
          {itemName && (
            <p className="mt-2 text-white font-medium text-sm bg-slate-700/50 rounded-lg px-3 py-2 truncate">
              "{itemName}"
            </p>
          )}
          
          {warning && (
            <p className="mt-4 text-slate-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              {warning}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-slate-700">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white rounded-lg transition-colors font-medium text-sm"
            data-testid="confirmation-modal-cancel"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 ${confirmButtonClasses} disabled:opacity-50 text-white rounded-lg transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800`}
            data-testid="confirmation-modal-confirm"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
