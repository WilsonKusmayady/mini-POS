import { useState, useEffect } from "react";
import { Button } from "./ui/button";
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
import { Check, ChevronsUpDown, Loader2, User, Phone } from 'lucide-react';
import { cn } from "@/lib/utils";
import axios from 'axios';

export interface Member {
    member_code: string;
    member_name: string;
    phone_number: string;
    address?: string;
    gender: boolean; // 1 = L, 0 = P
    birth_date?: string;
    created_at?: string;
}

interface MemberComboboxProps {
    value?: string;
    onSelect: (member: Member) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function MemberCombobox({
    value,
    onSelect,
    placeholder = "Pilih Member...",
    className,
    disabled = false
}: MemberComboboxProps) {
    const [open, setOpen] = useState(false);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const [selectedMemberCache, setSelectedMemberCache] = useState<Member | null>(null);

    // Fetch members from API
    // Ganti fungsi fetchMembers menjadi:
    const fetchMembers = async (pageParam: number, searchParam: string, reset = false) => {
        try {
            setLoading(true);
            console.log('Fetching members with params:', { page: pageParam, search: searchParam });
            
            const res = await axios.get('/members/search', {
                params: {
                    page: pageParam,
                    search: searchParam, // Parameter sesuai dengan controller
                    per_page: 20
                }
            });

            console.log('API Response:', res.data); // Debug response
            
            let newMembers: Member[] = [];

            // Cek struktur response
            if (res.data && res.data.data) {
                // Format: { data: [...], current_page: 1, ... }
                newMembers = Array.isArray(res.data.data) ? res.data.data : [];
                setHasMore(!!res.data.next_page_url);
                console.log('Using paginated format, found:', newMembers.length, 'members');
            } else if (Array.isArray(res.data)) {
                // Format langsung array: [...]
                newMembers = res.data;
                setHasMore(false);
                console.log('Using array format, found:', newMembers.length, 'members');
            } else {
                console.warn('Unexpected response format:', res.data);
                newMembers = [];
                setHasMore(false);
            }

            setMembers(prev => reset ? newMembers : [...prev, ...newMembers]);
            console.log('Total members in state:', members.length);
            
        } catch (error: any) {
            console.error("Gagal load member", error);
            console.error("Error details:", error.response?.data);
        } finally {
            setLoading(false);
        }
    };

    // Search debounce effect
    useEffect(() => {
        if (!open) return;

        const timeoutId = setTimeout(() => {
            setPage(1);
            fetchMembers(1, search, true);
        }, 300); // Debounce 300ms

        return () => clearTimeout(timeoutId);
    }, [search, open]);

    // Preload when opening
    useEffect(() => {
        if (open && members.length === 0) {
            fetchMembers(1, '', true);
        }
    }, [open]);

    // Infinite scroll
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            if (!loading && hasMore) {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchMembers(nextPage, search, false);
            }
        }
    };

    // Display label for selected member
    const displayLabel = members.find(m => m.member_code === value)?.member_name
        || selectedMemberCache?.member_name
        || (value ? `Member ${value}` : placeholder);

    // Get gender text
    const getGenderText = (gender: boolean) => gender ? 'Laki-laki' : 'Perempuan';

    // Format date
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('id-ID');
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn("w-full justify-between font-normal text-left", className)}
                >
                    <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        <span className="truncate">{displayLabel}</span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[450px] p-0" align="start">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Cari kode atau nama member..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList onScroll={handleScroll} className="max-h-[300px] overflow-y-auto">
                        {members.length === 0 && !loading && (
                            <CommandEmpty>
                                {search ? "Member tidak ditemukan" : "Tidak ada member"}
                            </CommandEmpty>
                        )}
                        <CommandGroup>
                            {members.map((member) => (
                                <CommandItem
                                    key={member.member_code}
                                    value={`${member.member_code} ${member.member_name}`}
                                    onSelect={() => {
                                        onSelect(member);
                                        setSelectedMemberCache(member);
                                        setOpen(false);
                                    }}
                                    className="py-3"
                                >
                                    <Check
                                        className={cn(
                                            "mr-3 h-4 w-4",
                                            value === member.member_code ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="font-medium">{member.member_name}</span>
                                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                                    {member.member_code}
                                                </span>
                                            </div>
                                            <span className="text-xs px-2 py-1 rounded bg-gray-100">
                                                {getGenderText(member.gender)}
                                            </span>
                                        </div>
                                        <div className="flex items-center mt-1 text-sm text-gray-600">
                                            <Phone className="h-3 w-3 mr-1" />
                                            <span>{member.phone_number}</span>
                                        </div>
                                        {member.address && (
                                            <div className="text-xs text-gray-500 truncate mt-1">
                                                {member.address}
                                            </div>
                                        )}
                                        {member.birth_date && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                Lahir: {formatDate(member.birth_date)}
                                            </div>
                                        )}
                                    </div>
                                </CommandItem>
                            ))}
                            {loading && (
                                <div className="p-4 flex justify-center items-center text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Memuat...
                                </div>
                            )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}