
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  selected,
  onChange,
  placeholder = "Select options..."
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeOption = (option: string) => {
    onChange(selected.filter(item => item !== option));
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between h-auto min-h-[40px] px-3 py-2"
      >
        <div className="flex flex-wrap gap-1">
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            selected.map(option => (
              <Badge 
                key={option} 
                variant="secondary" 
                className="text-xs hover:bg-secondary/80"
                onClick={(e) => {
                  e.stopPropagation();
                  removeOption(option);
                }}
              >
                {option}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))
          )}
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 opacity-50 transition-transform",
          isOpen && "rotate-180"
        )} />
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-auto">
          {options.map(option => (
            <div
              key={option}
              onClick={() => toggleOption(option)}
              className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <div className={cn(
                "flex items-center justify-center w-4 h-4 border border-gray-300 rounded mr-3",
                selected.includes(option) && "bg-blue-600 border-blue-600"
              )}>
                {selected.includes(option) && (
                  <Check className="h-3 w-3 text-white" />
                )}
              </div>
              <span className="text-sm">{option}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
