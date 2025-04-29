// components/ExerciseCombobox.tsx
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react" // Add Loader2

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { PredefinedExercise } from "@/lib/api" // Adjust path if needed, might be "../lib/api" depending on exact structure

interface ExerciseComboboxProps {
  predefinedExercises: PredefinedExercise[];
  value: string; // Current selected/typed exercise name
  onChange: (value: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  emptyText?: string;
  className?: string; // Allow passing additional classes
}

export function ExerciseCombobox({
    predefinedExercises,
    value,
    onChange,
    isLoading = false,
    placeholder = "Select or type exercise...",
    emptyText = "No exercise found.",
    className // Destructure className
}: ExerciseComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value || "") // Local input state
  const [isCustom, setIsCustom] = React.useState(false); // Track if current value is custom

  // Update internal input value and custom status when the external value changes
   React.useEffect(() => {
       const exerciseExists = predefinedExercises.some(ex => ex.name.toLowerCase() === (value || "").toLowerCase());
       setInputValue(value || "");
       setIsCustom(!!value && !exerciseExists); // Update custom status based on the new value
   }, [value, predefinedExercises]);

   // Handler when an item (predefined or custom suggestion) is selected from the list
   const handleSelect = (currentValue: string) => {
      onChange(currentValue); // Call the parent onChange with the selected/confirmed value
      setInputValue(currentValue); // Update local input display value
      setIsCustom(!predefinedExercises.some(ex => ex.name.toLowerCase() === currentValue.toLowerCase())); // Update custom status
      setOpen(false); // Close the popover
   };

   // Handler for changes in the CommandInput (typing)
   const handleInputChange = (search: string) => {
       setInputValue(search); // Update input value as user types
       // Check if the typed value exactly matches a predefined exercise
       const exactMatch = predefinedExercises.find(ex => ex.name.toLowerCase() === search.toLowerCase());
       if (exactMatch) {
            // If it's an exact match, treat it as selecting that predefined exercise
            onChange(exactMatch.name); // Update parent state with the exact match name
            setIsCustom(false);
       } else {
            // If not an exact match, update parent state with the currently typed value (potential custom exercise)
            onChange(search);
            setIsCustom(true); // Mark as potentially custom
       }
   }

    // Determine display text for the trigger button
    const displayValue = isLoading
        ? ( <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</> )
        : value
        ? value // Show selected or typed value directly
        : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          // Combine passed className with default classes
          className={cn("w-full justify-between font-normal", isCustom && "italic text-muted-foreground", className)}
          disabled={isLoading}
        >
          <span className="truncate">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
        {/* Use filtering based on CommandInput */}
        <Command filter={(itemValue, search) => {
            if (itemValue.toLowerCase().includes(search.toLowerCase())) return 1;
            return 0;
        }}>
          <CommandInput
             placeholder={placeholder}
             value={inputValue} // Bind input value to local state
             onValueChange={handleInputChange} // Use custom handler for typing
          />
          <CommandList>
             {/* Show message only if input is not empty and no predefined matches */}
             <CommandEmpty>
                {emptyText}{" "}
                {inputValue && `Press Enter or click below to add "${inputValue}" as custom.`}
             </CommandEmpty>
            <CommandGroup>
              {/* Display predefined exercises that match the filter */}
              {predefinedExercises
                 .map((exercise) => (
                    <CommandItem
                        key={exercise.id}
                        value={exercise.name} // Value used for filtering & selection
                        onSelect={() => handleSelect(exercise.name)} // Pass name on select
                    >
                        <Check
                            className={cn(
                            "mr-2 h-4 w-4",
                            // Check against the main `value` prop for the checkmark
                            value?.toLowerCase() === exercise.name.toLowerCase() ? "opacity-100" : "opacity-0"
                            )}
                        />
                        {exercise.name}
                    </CommandItem>
              ))}
            </CommandGroup>
             {/* Option to explicitly confirm/add the currently typed custom exercise */}
             {inputValue && !predefinedExercises.some(ex => ex.name.toLowerCase() === inputValue.toLowerCase()) && (
                 <CommandItem
                     key="custom-confirm"
                     value={inputValue} // Use the input value itself
                     onSelect={() => handleSelect(inputValue)} // Confirm the custom value
                     className="italic text-muted-foreground"
                 >
                    <Check className="mr-2 h-4 w-4 opacity-0" /> {/* Placeholder check */}
                     Add custom: "{inputValue}"
                 </CommandItem>
             )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}