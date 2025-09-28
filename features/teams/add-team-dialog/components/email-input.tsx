import { TagsInput } from '@/components/ui/tags-input';
import { Observable } from '@legendapp/state';
import { use$ } from '@legendapp/state/react';
import { cn } from '@/lib/utils';

export interface EmailInputProps {
  $value: Observable<string[]>;
  className?: string;
}

export const EmailInput = ({ $value, className }: EmailInputProps) => {
  const emails = use$($value) || [];
  const handleValueChange = (emails: string[]) => $value.set(emails);

  // Email validation function
  const validateEmail = (email: string): boolean | string => {
    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return true;
  };

  return (
    <TagsInput
      className={cn('h-auto min-h-[120px] text-sm placeholder:text-sm', className)}
      placeholder={emails.length > 0 ? 'Add email...' : 'michael@bluth.com, buster@bluth.com...'}
      value={emails}
      onValueChange={handleValueChange}
      validateInput={validateEmail}
    />
  );
};
