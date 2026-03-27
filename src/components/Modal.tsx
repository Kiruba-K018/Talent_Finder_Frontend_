import React from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  actions?: React.ReactNode;
  closeButtonAriaLabel?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  children,
  onClose,
  actions,
  closeButtonAriaLabel = 'Close dialog',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      role="presentation"
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 id="modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={closeButtonAriaLabel}
            type="button"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
        {actions && (
          <div className="p-6 border-t border-gray-200 flex gap-2 justify-end">{actions}</div>
        )}
      </div>
    </div>
  );
};
