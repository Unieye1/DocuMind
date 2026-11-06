
import { useState } from "react";
import { ChevronDown, LogOut, UserRound } from "lucide-react";

function ProfileMenu({ user, onLogout, loading }) {
  const [isOpen, setIsOpen] = useState(false);

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-slate-100"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-700">
          {initials}
        </div>

        <ChevronDown
          size={16}
          className={`text-slate-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-4 py-4">
            <p className="font-semibold text-sm text-slate-800">
              {user.name}
            </p>

            <p className="mt-1 truncate text-xs text-slate-500">
              {user.email}
            </p>
          </div>

          <div className="p-2">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600">
              <UserRound size={17} />
              My Account
            </div>

            <button
              onClick={onLogout}
              disabled={loading}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              <LogOut size={17} />
              {loading ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileMenu;
