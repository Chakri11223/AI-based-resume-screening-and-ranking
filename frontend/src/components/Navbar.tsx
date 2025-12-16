import { Menu, Moon, Sun, User, Mail, Briefcase, Building } from "lucide-react";
import { Button } from "./ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar = ({ onMenuClick }: NavbarProps) => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [showProfile, setShowProfile] = useState(false);

  // Mock user data fallback if not in local storage
  const user = JSON.parse(localStorage.getItem("user") || '{"firstName": "Guest", "lastName": "User", "email": "guest@example.com", "role": "Recruiter", "company": "Tech Corp"}');

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const getInitials = () => {
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` || 'U';
  };

  return (
    <>
      <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="h-full px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="hover:bg-accent"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="hover:bg-accent"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-accent rounded-full">
                  <User className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2 border-b mb-1">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                    {getInitials()}
                  </div>
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuItem onClick={() => setShowProfile(true)} className="cursor-pointer">
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.href = "/login";
                  }}
                  className="cursor-pointer text-red-500 focus:text-red-500"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <Avatar className="w-24 h-24 border-4 border-primary/10">
              <AvatarImage src="" />
              <AvatarFallback className="text-2xl bg-primary/5 text-primary">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
              <p className="text-muted-foreground">{user.role || 'User'}</p>
            </div>

            <div className="w-full grid gap-2 mt-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <Briefcase className="w-4 h-4 text-primary" />
                <span className="text-sm capitalize">{user.role || 'Recruiter'}</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                <Building className="w-4 h-4 text-primary" />
                <span className="text-sm">{user.company || 'Not Specified'}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
