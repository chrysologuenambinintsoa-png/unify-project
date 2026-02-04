 'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Modal, ModalBody, ModalHeader, ModalFooter } from '@/components/ui/Modal';

interface PreviewModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  title?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PreviewModal({ isOpen, imageSrc, title = 'Aperçu', onConfirm, onCancel }: PreviewModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="md">
      <ModalHeader onClose={onCancel}>{title}</ModalHeader>

      <ModalBody>
        <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded">
          {imageSrc ? (
            <img src={imageSrc} alt="preview" className="max-h-60 max-w-full object-contain rounded" />
          ) : (
            <div className="text-sm text-gray-500">Aucun aperçu disponible</div>
          )}
        </div>
      </ModalBody>

      <ModalFooter>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={onCancel}>Annuler</Button>
          <Button onClick={onConfirm}>Appliquer</Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
