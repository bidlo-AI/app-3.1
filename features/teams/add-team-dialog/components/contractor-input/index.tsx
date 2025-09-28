export const ContractorInput = () => {
  return <div>ContractorInput</div>;
};

// import {
//   Command,
//   CommandEmpty,
//   CommandGroup,
//   CommandInput,
//   CommandItem,
//   CommandList,
// } from "@/components/ui/command";
// import {
//   Popover,
//   PopoverContent,
//   PopoverTrigger,
// } from "@/components/ui/popover";
// import { Check, ChevronDown } from "lucide-react";
// import { Observable } from "@legendapp/state";
// import { cn } from "@/lib/utils";
// import { useState, useEffect } from "react";
// import { Contractor } from "@/features/teams/types/team";
// import { createClient } from "@/lib/supabase/client";
// import { LoadingList } from "./loading";
// import { ContractorAvatar } from "../../card/contractor-avatar";
// import { Button } from "@/components/ui/button";

// export interface ContractorInputProps {
//   $value: Observable<Contractor>;
//   className?: string;
// }

// export const ContractorInput = ({
//   $value,
//   className,
// }: ContractorInputProps) => {
//   const [open, setOpen] = useState(false);
//   const [contractors, setContractors] = useState<Contractor[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");

//   // Fetch contractors from the database
//   useEffect(() => {
//     fetchContractors(searchQuery);
//   }, [searchQuery]);

//   // handlers
//   const handleSearchChange = (value: string) => setSearchQuery(value);
//   const handleSelect = (contractor: Contractor) => {
//     $value.set(contractor);
//     setOpen(false);
//     fetchContractors("");
//   };
//   const handleCreateNew = () => {
//     const newContractor: Contractor = {
//       id: "new", // Special ID to indicate this is a new contractor
//       name: searchQuery,
//       icon: "",
//     };
//     $value.set(newContractor);
//     setOpen(false);
//   };

//   //finctions
//   const fetchContractors = async (query_string: string) => {
//     setIsLoading(true);
//     try {
//       const supabase = createClient();
//       const query = supabase
//         .from("app_documents")
//         .select("id, name, icon")
//         .eq("collection_id", process.env.NEXT_PUBLIC_CONTRACTORS_COLLECTION)
//         .is("owner_id", null)
//         .limit(25);

//       // Add search filter if there's a query
//       if (query_string) query.ilike("name", `%${query_string}%`);
//       const { data, error } = await query;

//       if (error) {
//         console.error("Error fetching contractors:", error);
//         return;
//       }

//       setContractors(data as Contractor[]);
//     } catch (error) {
//       console.error("Error fetching contractors:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <Popover open={open} onOpenChange={setOpen} modal>
//       <PopoverTrigger
//         className={cn(
//           "text-muted-foreground bg-input px-2 h-9 flex gap-2 items-center justify-between rounded-md border border-input text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer w-full",
//           className
//         )}
//       >
//         <ContractorAvatar contractor={$value.get()} />
//         <div
//           className={cn(
//             "truncate text-left flex-1 text-sm",
//             $value.get().name && "text-foreground"
//           )}
//         >
//           {$value.get().name || "Select a contractor"}
//         </div>
//         <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
//       </PopoverTrigger>
//       <PopoverContent
//         noAnimation
//         align="start"
//         alignOffset={0}
//         sideOffset={-37}
//         avoidCollisions={false}
//         className="p-0 shadow-md border-border/30"
//         style={{ width: "var(--radix-popover-trigger-width)" }}
//       >
//         <Command className="rounded-lg border-none">
//           <CommandInput
//             className="h-9"
//             placeholder="Search contractors..."
//             onValueChange={handleSearchChange}
//           />
//           <CommandList className="max-h-[300px] max-w-full">
//             {isLoading ? (
//               <LoadingList />
//             ) : (
//               <>
//                 <CommandEmpty>
//                   <Button variant="outline" size="sm" onClick={handleCreateNew}>
//                     <span>Create: &quot;{searchQuery}&quot;</span>
//                   </Button>
//                 </CommandEmpty>
//                 <CommandGroup>
//                   {contractors.map((contractor) => (
//                     <CommandItem
//                       key={contractor.id}
//                       value={contractor.name}
//                       onSelect={() => handleSelect(contractor)}
//                       className="flex items-center justify-between truncate"
//                     >
//                       <ContractorAvatar contractor={contractor} />
//                       <div className="flex-1 truncate">{contractor.name}</div>
//                       {$value.get().id === contractor.id && (
//                         <Check className="ml-auto h-4 w-4" />
//                       )}
//                     </CommandItem>
//                   ))}
//                 </CommandGroup>
//               </>
//             )}
//           </CommandList>
//         </Command>
//       </PopoverContent>
//     </Popover>
//   );
// };
