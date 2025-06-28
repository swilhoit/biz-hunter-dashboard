import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToggleFavorite } from '@/hooks/useBusinessListings';
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
  const [saved, setSaved] = useState(isSaved);
  const toggleFavorite = useToggleFavorite();

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please sign in to save listings');
      return;
    }

    try {
      const result = await toggleFavorite.mutateAsync({
        listingId,
        userId: user.id
      });

      const newSavedState = result === 'added';
      setSaved(newSavedState);
      onSaveChange?.(newSavedState);
      
      if (result === 'added') {
        toast.success('Listing saved!');
      } else {
        toast.success('Listing removed from saved');
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error('Failed to update saved status');
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSaveToggle}
      disabled={toggleFavorite.isPending}
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