import React, { useState, useEffect } from 'react';
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

  // Sync internal state with prop changes
  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  const handleSaveToggle = async (e: React.MouseEvent) => {
    console.log('🖱️ SaveButton clicked!', { listingId, user: user?.email, saved });
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      console.log('❌ No user - showing sign in error');
      toast.error('Please sign in to save listings');
      return;
    }

    console.log('✅ User authenticated:', user.email);

    // Optimistic update
    const newSavedState = !saved;
    console.log('🔄 Optimistic update:', saved, '->', newSavedState);
    setSaved(newSavedState);
    onSaveChange?.(newSavedState);

    try {
      console.log('🔄 Starting save operation for listing:', listingId);
      const result = await toggleFavorite.mutateAsync({
        listingId,
        userId: user.id
      });

      const actualSavedState = result === 'added';
      setSaved(actualSavedState);
      onSaveChange?.(actualSavedState);
      
      console.log('✅ Save operation completed:', result, 'New state:', actualSavedState);
      
      if (result === 'added') {
        console.log('📢 Showing success toast: Listing saved!');
        toast.success('❤️ Listing saved to favorites!');
      } else {
        console.log('📢 Showing success toast: Listing removed');
        toast.success('💔 Listing removed from favorites');
      }
    } catch (error) {
      console.error('❌ Error toggling save:', error);
      // Revert optimistic update on error
      setSaved(!newSavedState);
      onSaveChange?.(!newSavedState);
      console.log('📢 Showing error toast');
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