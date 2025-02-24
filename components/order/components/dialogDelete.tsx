'use client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import * as AlertDialogR from '@radix-ui/react-alert-dialog';
import { ReloadIcon } from '@radix-ui/react-icons';
import axios from 'axios';
import { useState } from 'react';
import { toast } from 'react-toastify';

export function AlertDialogDeletetransaction({
  open,
  onClose,
  transactionId,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  transactionId: string | null;
  onDelete: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleCancel = () => {
    onClose();
  };

  const handleDelete = async () => {
    if (!transactionId) return;

    setLoading(true);
    try {
      if (!navigator.onLine) {
        toast.error('You are offline. Please check your internet connection.');
        return;
      }

      const response = await axios.delete(`/api/transactions/${transactionId}`);
      if (response.status === 200 || response.status === 204) {
        toast.success('Transaction deleted successfully!');
        onDelete(); // Call the parent’s delete handler
      } else if (response.status === 404) {
        toast.warn('Transaction not found in the database.');
        onDelete();
      } else {
        toast.error('Failed to delete transaction');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error('Error deleting transaction: ' + error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open}>
      <AlertDialogR.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete
            Transaction with Id: {transactionId} and remove data from server.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={loading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="text-gray-100"
          >
            {loading ? (
              <>
                <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogR.Content>
    </AlertDialog>
  );
}