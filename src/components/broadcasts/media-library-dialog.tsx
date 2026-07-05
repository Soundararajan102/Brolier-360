'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, FileText, Video, ImageIcon, FileIcon, Trash2 } from 'lucide-react';
import { deleteAccountMedia } from '@/lib/storage/upload-media';

interface MediaLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaType: 'image' | 'video' | 'document';
  activeUrl?: string | null;
  onSelect: (url: string) => void;
}

interface StorageFile {
  name: string;
  id: string | null;
  updated_at: string | null;
  created_at: string | null;
  metadata: Record<string, unknown> | null;
}

const EXTENSIONS = {
  image: ['.png', '.jpeg', '.jpg', '.webp'],
  video: ['.mp4', '.3gpp', '.3gp'],
  document: ['.pdf', '.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
};

export function MediaLibraryDialog({
  open,
  onOpenChange,
  mediaType,
  activeUrl,
  onSelect,
}: MediaLibraryDialogProps) {
  const { accountId } = useAuth();
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const BATCH_SIZE = 50;

  const loadFiles = useCallback(
    async (currentOffset: number, append = false) => {
      if (!accountId) return;
      setLoading(true);
      setError(null);

      try {
        const supabase = createClient();
        const { data, error: listError } = await supabase.storage
          .from('chat-media')
          .list(`account-${accountId}`, {
            limit: BATCH_SIZE,
            offset: currentOffset,
            sortBy: { column: 'created_at', order: 'desc' },
          });

        if (listError) throw listError;

        const validExtensions = EXTENSIONS[mediaType] || [];
        
        // Filter files that match the requested media type and are not folders (which have no size metadata or are named '.emptyFolderPlaceholder')
        const filteredFiles = (data || []).filter((file) => {
          if (file.name === '.emptyFolderPlaceholder' || file.name === '.keep') return false;
          // Simple extension check
          const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
          return validExtensions.includes(ext);
        });

        const mappedFiles: StorageFile[] = filteredFiles.map(file => ({
          name: file.name,
          id: file.id,
          updated_at: file.updated_at,
          created_at: file.created_at,
          metadata: file.metadata
        }));

        if (append) {
          setFiles((prev) => [...prev, ...mappedFiles]);
        } else {
          setFiles(mappedFiles);
        }

        // If we received fewer items than the batch size, we've hit the end of the bucket
        setHasMore((data || []).length === BATCH_SIZE);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load media library');
      } finally {
        setLoading(false);
      }
    },
    [accountId, mediaType]
  );

  // Initial load when dialog opens
  useEffect(() => {
    if (open) {
      setFiles([]);
      setOffset(0);
      setHasMore(true);
      loadFiles(0, false);
    }
  }, [open, loadFiles]);

  const handleLoadMore = () => {
    const nextOffset = offset + BATCH_SIZE;
    setOffset(nextOffset);
    loadFiles(nextOffset, true);
  };

  const handleSelect = (file: StorageFile) => {
    const supabase = createClient();
    const {
      data: { publicUrl },
    } = supabase.storage
      .from('chat-media')
      .getPublicUrl(`account-${accountId}/${file.name}`);
    onSelect(publicUrl);
  };

  const handleDelete = async (e: React.MouseEvent, file: StorageFile, publicUrl: string) => {
    e.stopPropagation();
    if (!accountId) return;
    
    if (!window.confirm('Are you sure you want to permanently delete this file? This action cannot be undone.')) {
      return;
    }

    setIsDeletingId(file.id);
    setError(null);
    try {
      await deleteAccountMedia('chat-media', `account-${accountId}/${file.name}`);
      
      // Optimistic UI removal
      setFiles((prev) => prev.filter((f) => f.id !== file.id));

      // Active URL deselection edge case
      if (activeUrl === publicUrl) {
        onSelect('');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete media');
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mediaType === 'image' && <ImageIcon className="h-5 w-5 text-primary" />}
            {mediaType === 'video' && <Video className="h-5 w-5 text-primary" />}
            {mediaType === 'document' && <FileText className="h-5 w-5 text-primary" />}
            Select {mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}
          </DialogTitle>
          <DialogDescription>
            Choose a previously uploaded file from your library.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <ScrollArea className="flex-1 -mx-4 px-4 overflow-y-auto min-h-[300px]">
          {files.length === 0 && !loading && !error ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <FileIcon className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm">No {mediaType}s found in your library.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 py-4">
              {files.map((file) => {
                const supabase = createClient();
                const {
                  data: { publicUrl },
                } = supabase.storage
                  .from('chat-media')
                  .getPublicUrl(`account-${accountId}/${file.name}`);
                  
                return (
                  <button
                    key={file.id}
                    onClick={() => handleSelect(file)}
                    className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all text-left"
                  >
                    {/* Delete Overlay */}
                    <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon-sm"
                        className="h-7 w-7 rounded-full shadow-md"
                        disabled={isDeletingId === file.id}
                        onClick={(e) => handleDelete(e, file, publicUrl)}
                      >
                        {isDeletingId === file.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>

                    {mediaType === 'image' ? (
                      <div className="aspect-square w-full bg-muted overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={publicUrl}
                          alt={file.name}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square w-full bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                        {mediaType === 'video' ? (
                          <Video className="h-12 w-12 text-muted-foreground/50" />
                        ) : (
                          <FileText className="h-12 w-12 text-muted-foreground/50" />
                        )}
                      </div>
                    )}
                    <div className="p-2 border-t border-border/50">
                      <p className="truncate text-xs font-medium text-foreground" title={file.name}>
                        {/* Remove the timestamp prefix (e.g. 1709829123-filename.ext) for cleaner display */}
                        {file.name.replace(/^\d+-/, '')}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {file.created_at ? new Date(file.created_at).toLocaleDateString() : ''}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {!loading && hasMore && files.length > 0 && (
            <div className="flex justify-center py-4">
              <Button variant="secondary" onClick={handleLoadMore}>
                Load More
              </Button>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
