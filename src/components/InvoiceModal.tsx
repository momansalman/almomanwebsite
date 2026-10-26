"use client";

import React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import InvoiceViewer, { InvoiceViewerProps } from "./InvoiceViewer";

interface InvoiceModalProps extends InvoiceViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InvoiceModal({ isOpen, onClose, ...viewerProps }: InvoiceModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-700 hover:bg-zinc-800 transition"
            aria-label="Close invoice"
          >
            <X className="w-5 h-5" />
          </button>

          <InvoiceViewer {...viewerProps} />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
