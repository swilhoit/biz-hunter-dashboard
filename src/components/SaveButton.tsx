import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SaveButtonProps {
  listingId: string;
  isSaved?: boolean;
  onSaveChange?: (saved: boolean) => void;
  className?: string;
}

export const SaveButton: React.FC<SaveButtonProps> = ({ 
  listingId, 
  isSaved = false, 
  onSaveChange,
  className = "" 
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(isSaved);

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please sign in to save listings');
      return;
    }

    setIsLoading(true);

    try {
      const method = saved ? 'DELETE' : 'POST';
      const url = saved 
        ? `https://biz-hunter-dashboard-production.up.railway.app/api/favorites/${listingId}?userId=${user.id}`
        : 'https://biz-hunter-dashboard-production.up.railway.app/api/favorites';

      const body = saved ? undefined : JSON.stringify({
        listingId,
        userId: user.id
      });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body
      });

      const data = await response.json();

      if (data.success) {
        const newSavedState = !saved;
        setSaved(newSavedState);
        onSaveChange?.(newSavedState);
        toast.success(newSavedState ? 'Listing saved!' : 'Listing removed from saved');
      } else {
        if (response.status === 409) {
          toast.info('Listing is already saved');
        } else {
          throw new Error(data.message || 'Failed to update saved status');
        }
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error('Failed to update saved status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSaveToggle}
      disabled={isLoading}
      className={`p-2 hover:bg-red-50 ${className}`}
      title={saved ? 'Remove from saved' : 'Save listing'}
    >
      <Heart 
        className={`h-4 w-4 transition-colors ${
          saved 
            ? 'fill-red-500 text-red-500' 
            : 'text-gray-400 hover:text-red-500'
        }`} 
      />
    </Button>
  );
};