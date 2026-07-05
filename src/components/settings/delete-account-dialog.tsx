'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, AlertTriangle } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      setOpen(newOpen);
      if (!newOpen) setConfirmation('');
    }
  };

  const handleDelete = async () => {
    if (confirmation !== 'DELETE') return;

    setLoading(true);
    try {
      const res = await fetch('/api/account', {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Failed to delete account');
      }

      const supabase = createClient();
      await supabase.auth.signOut();

      toast.success('Account deleted: Your account and all associated data have been permanently deleted.');

      // Force hard redirect to clear all client states
      window.location.href = '/signup';
    } catch (error) {
      console.error('Delete account error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete account');
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger 
        render={<Button variant="destructive" className="w-full sm:w-auto" />}
      >
        Delete Account
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription className="pt-2 text-sm text-foreground">
            This action is <strong>permanent and irreversible</strong>. It will immediately and completely wipe your identity, contacts, media, templates, and all other data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation" className="text-xs">
              To confirm, type <strong>DELETE</strong> below:
            </Label>
            <Input
              id="confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE"
              className="col-span-3"
              autoComplete="off"
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={confirmation !== 'DELETE' || loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Permanently Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
