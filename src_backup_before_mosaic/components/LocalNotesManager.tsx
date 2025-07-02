import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, Loader2, FileText, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LocalNotesManagerProps {
  favoriteId: string;
  listingName: string;
}

export const LocalNotesManager: React.FC<LocalNotesManagerProps> = ({
  favoriteId,
  listingName
}) => {
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  // Load notes from localStorage on component mount
  useEffect(() => {
    const savedNotes = localStorage.getItem(`listing-notes-${favoriteId}`);
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, [favoriteId]);

  // Track changes
  useEffect(() => {
    const savedNotes = localStorage.getItem(`listing-notes-${favoriteId}`) || '';
    setHasChanges(notes !== savedNotes);
  }, [notes, favoriteId]);

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(`listing-notes-${favoriteId}`, notes);
      
      // Simulate a brief save delay for UX
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setHasChanges(false);
      toast({
        title: 'Notes saved',
        description: 'Your notes have been saved locally.',
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <Info className="h-4 w-4 text-blue-600" />
          <p className="text-sm text-blue-800">
            Notes are saved locally on your device. Database migration in progress for cloud sync.
          </p>
        </div>
      </div>

      {/* Notes Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Notes for {listingName}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add your thoughts, due diligence notes, questions, or any other information about this listing..."
            className="min-h-[120px] mb-3"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {notes.length} characters
            </p>
            <Button
              onClick={handleSaveNotes}
              disabled={isSaving || !hasChanges}
              size="sm"
              variant={hasChanges ? "default" : "secondary"}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {hasChanges ? 'Save Notes' : 'Saved'}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Future File Upload Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Documents & Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">File upload feature coming soon!</p>
            <p className="text-xs">Database migration needed to enable document storage.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};