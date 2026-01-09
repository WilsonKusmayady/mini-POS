import { type User } from '@/types';

export function UserInfo({
    user,
}: {
    user: User | null;
}) {
    if (!user) return null;

    return (
        <div className="text-left text-sm">
            <span className="truncate font-medium">
                {user.name}
            </span>
        </div>
    );
}
