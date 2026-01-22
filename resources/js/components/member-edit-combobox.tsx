// components/member-edit-combobox.tsx
import { useState, useEffect, useMemo } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import axios from 'axios';

export interface Member {
  member_code: string;
  member_name: string;
}

export interface MemberEditComboboxProps {
  value: string;
  onSelect: (member: Member) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  initialValue?: Member;
}

export function MemberEditCombobox({
  value,
  onSelect,
  placeholder = "Pilih member...",
  disabled = false,
  className,
  initialValue
}: MemberEditComboboxProps) {
  const [open, setOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Gabungkan initialValue dengan members yang difetch
  const allMembers = useMemo(() => {
    const memberMap = new Map<string, Member>();
    
    // Tambahkan initialValue jika ada
    if (initialValue) {
      memberMap.set(initialValue.member_code, initialValue);
    }
    
    // Tambahkan semua members dari state
    members.forEach(member => {
      memberMap.set(member.member_code, member);
    });
    
    return Array.from(memberMap.values());
  }, [members, initialValue]);

  

  // Fetch members berdasarkan search
  useEffect(() => {
    const fetchMembers = async () => {
      if (search.length < 2 && !initialValue) {
        setMembers([]);
        return;
      }
      
      setLoading(true);
      try {
        const response = await axios.get('/api/members/search', {
          params: { q: search || '' }
        });
        
        if (response.data.data) {
          setMembers(response.data.data);
        } else {
          setMembers([]);
        }
      } catch (error) {
        console.error('Error fetching members:', error);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchMembers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search, initialValue]);

  // Cari member yang terpilih
  const selectedMember = allMembers.find((member: Member) => member.member_code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedMember ? (
            <span className="truncate">{selectedMember.member_name} ({selectedMember.member_code})</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Cari member..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "Mencari..." : "Member tidak ditemukan"}
            </CommandEmpty>
            <CommandGroup>
              {allMembers.map((member: Member) => (
                <CommandItem
                  key={member.member_code}
                  value={`${member.member_name} ${member.member_code}`}
                  onSelect={() => {
                    onSelect(member);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === member.member_code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{member.member_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {member.member_code}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}