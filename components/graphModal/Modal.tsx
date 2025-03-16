// components/graphModal/Modal.tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      onClick={onClose}  // Clicking on the overlay closes the modal
    >
      <div
        className={cn(
          "relative w-full max-w-3xl p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800"
        )}
        onClick={(e) => e.stopPropagation()}  // Prevent closing when clicking inside the modal content
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
