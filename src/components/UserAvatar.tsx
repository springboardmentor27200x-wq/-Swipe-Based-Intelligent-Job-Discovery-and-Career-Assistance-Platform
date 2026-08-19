import React from "react";

interface UserAvatarProps {
  avatarUrl?: string | null;
  name?: string | null;
  email?: string | null;
  className?: string;
  onClick?: () => void;
  textSize?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  name,
  email,
  className = "w-8 h-8",
  onClick,
  textSize = "text-xs",
}) => {
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  // Compute the first letter of username / full_name in CAPITAL
  const getInitial = () => {
    const displayName = name || email || "?";
    const cleaned = displayName.trim();
    if (!cleaned) return "?";
    return cleaned.charAt(0).toUpperCase();
  };

  const initial = getInitial();

  // If avatarUrl exists and image didn't fail loading
  if (avatarUrl && avatarUrl.trim() !== "" && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name || "User Avatar"}
        onError={() => setImgError(true)}
        className={`${className} rounded-full object-cover border border-slate-200 cursor-pointer shadow-xs`}
        onClick={onClick}
        referrerPolicy="no-referrer"
      />
    );
  }

  // Fallback: Display CAPITAL first letter badge
  return (
    <div
      onClick={onClick}
      className={`${className} rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-700 to-purple-700 text-white font-extrabold flex items-center justify-center border-2 border-white shadow-sm cursor-pointer select-none shrink-0 ${textSize}`}
      title={name || email || "User Profile"}
    >
      {initial}
    </div>
  );
};
