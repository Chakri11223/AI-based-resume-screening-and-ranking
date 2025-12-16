import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Upload, 
  FileText, 
  Sparkles, 
  BarChart3, 
  MessageSquare, 
  Star, 
  Settings,
  FileEdit
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
}

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Sparkles, label: "AI Screening", path: "/screening" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: MessageSquare, label: "AI Interview", path: "/interview" },
  { icon: FileEdit, label: "Resume Builder", path: "/resume-builder" },
  { icon: Star, label: "Shortlisted", path: "/shortlisted" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export const Sidebar = ({ isOpen }: SidebarProps) => {
  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
        isOpen ? "w-64" : "w-20"
      )}
    >
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          {isOpen && (
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-sidebar-foreground">AI Resume Screening</h1>
              <p className="text-xs text-muted-foreground">Smart Hiring</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                "hover:bg-sidebar-accent hover:shadow-sm",
                isActive && "bg-sidebar-accent shadow-glow border border-primary/20",
                !isOpen && "justify-center"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary" : "text-sidebar-foreground"
                  )} 
                />
                {isOpen && (
                  <span 
                    className={cn(
                      "text-sm font-medium",
                      isActive ? "text-primary" : "text-sidebar-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};
