'use client';
import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  categoryName: string;
}

export const CategoryDeleteModal: React.FC<Props> = ({ isOpen, onClose, onConfirm, categoryName }) => {
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ยืนยันการลบ">
      <div className="py-4">
        <p className="text-gray-700">
          คุณแน่ใจหรือไม่ว่าต้องการลบหมวดหมู่ <strong>"{categoryName}"</strong> ?<br/>
          การกระทำนี้ไม่สามารถย้อนกลับได้
        </p>
      </div>
      <div className="flex justify-end gap-3 mt-4">
        <Button variant="secondary" onClick={onClose} disabled={loading}>ยกเลิก</Button>
        <Button variant="danger" onClick={handleConfirm} loading={loading}>ยืนยันการลบ</Button>
      </div>
    </Modal>
  );
};
