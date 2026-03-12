import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProps {
  fullName: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const UserAvatar = ({ fullName, avatarUrl, size = 'md' }: UserAvatarProps) => {
  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={avatarUrl || undefined} alt={fullName} />
      <AvatarFallback className="gradient-primary text-primary-foreground font-semibold">
        {getInitials(fullName)}
      </AvatarFallback>
    </Avatar>
  );
};

export default UserAvatar;