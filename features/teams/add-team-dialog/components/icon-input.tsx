'use client';

import type { Observable } from '@legendapp/state';
import { batch } from '@legendapp/state';
import { use$, Show } from '@legendapp/state/react';
import { NewOrganization } from '@/features/auth/organizations/types';
import { ChangeEvent, useRef } from 'react';
import { Upload } from 'lucide-react';
import { X } from 'lucide-react';

const alt = 'New team avatar';

export const IconInput = ({
  team$,
  file$,
}: {
  team$: Observable<NewOrganization>;
  file$: Observable<File | undefined>;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const avatarUrl = use$(
    () =>
      team$.avatar.get() ||
      team$.default_contractor.icon.get() ||
      `https://api.dicebear.com/9.x/initials/svg?seed=${
        team$.name.get() || 'banana'
      }&backgroundColor=fb8c00,e53935,fdd835,d81b60,43a047,039be5,5e35b1,ffb300,f4511e,8e24aa,3949ab,1e88e5&backgroundType[]&fontFamily=sans-serif&chars=1`,
  );

  //handerls
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;

    if (selectedFile) {
      // Create a temporary URL for preview
      const objectUrl = URL.createObjectURL(selectedFile);

      // Set the avatar URL in the team observable - using "string" type as defined in the Team interface
      // The Team type defines avatar as "string" (with quotes) which is a Legend State specific type
      team$.avatar.set(objectUrl as unknown as 'string');

      // Store the file for form submission
      file$.set(selectedFile);
    }
  };
  const handleClick = () => inputRef.current?.click();
  const handleClear = () =>
    batch(() => {
      team$.avatar.delete();
      file$.set(undefined);
    });

  return (
    <div className="relative group">
      <div
        className="relative size-9 bg-input border rounded-md shrink-0 cursor-pointer  overflow-hidden"
        onClick={handleClick}
      >
        <img src={avatarUrl} alt={alt} className="size-full rounded-md shrink-0 object-cover" />
        <div className="size-full absolute inset-0 flex items-center justify-center bg-black/70 opacity-0 group-hover:opacity-100 ">
          <Upload className="size-4 text-white" />
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
      <Show if={file$}>
        <div className="absolute -top-1 -left-2 rounded-full size-fit bg-secondary border border-input shadow-sm hidden group-hover:flex overflow-hidden">
          <button type="button" onClick={handleClear} className=" p-0.5 hover:bg-hover m-0 rounded-full cursor-pointer">
            <X className="size-3" />
          </button>
        </div>
      </Show>
    </div>
  );
};
