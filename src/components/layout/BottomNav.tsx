import { Home, Users, Search, Calendar, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  icon: typeof Home;
  label: string;
  action: () => void;
  isActive: boolean;
}

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLoggedIn = !!user;


  const scrollToSection = (sectionId: string, dashboardSection?: boolean) => {
    if (dashboardSection && location.pathname !== "/dashboard") {
      navigate("/dashboard");
      // Use setTimeout to scroll after navigation
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else if (location.pathname === "/dashboard") {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    } else if (location.pathname !== "/") {
      navigate("/", { state: { scrollTo: sectionId } });
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const navItems: NavItem[] = [
    {
      icon: Home,
      label: "Home",
      action: () => {
        if (location.pathname === "/") {
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          navigate("/");
        }
      },
      isActive: location.pathname === "/",
    },
    {
      icon: Users,
      label: "Circle",
      action: () => {
        if (isLoggedIn) {
          if (location.pathname === "/dashboard") {
            const element = document.getElementById("connections-section");
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            }
          } else {
            navigate("/find-parents");
          }
        } else {
          scrollToSection("circle-preview");
        }
      },
      isActive: location.pathname === "/find-parents",
    },
    {
      icon: Search,
      label: "Discover",
      action: () => {
        if (location.pathname !== "/") {
          navigate("/");
          setTimeout(() => {
            const element = document.getElementById("discover");
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            }
          }, 100);
        } else {
          const element = document.getElementById("discover");
          if (element) {
            element.scrollIntoView({ behavior: "smooth" });
          }
        }
      },
      isActive: location.pathname === "/activities",
    },
    {
      icon: Calendar,
      label: "Plan",
      action: () => {
        if (isLoggedIn) {
          if (location.pathname === "/dashboard") {
            const element = document.getElementById("coordination-section");
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            }
          } else {
            navigate("/dashboard");
            setTimeout(() => {
              const element = document.getElementById("coordination-section");
              if (element) {
                element.scrollIntoView({ behavior: "smooth" });
              }
            }, 100);
          }
        } else {
          scrollToSection("plan-preview");
        }
      },
      isActive: false,
    },
    {
      icon: User,
      label: "Profile",
      action: () => {
        if (isLoggedIn) {
          if (location.pathname !== "/dashboard") {
            navigate("/dashboard");
          } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        } else {
          navigate("/auth");
        }
      },
      isActive: location.pathname === "/dashboard" || location.pathname === "/auth",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t md:hidden safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <button
            key={item.label}
            onClick={item.action}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-lg transition-colors min-w-[64px]",
              item.isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon
              className={cn(
                "h-5 w-5 transition-transform",
                item.isActive && "scale-110"
              )}
              strokeWidth={item.isActive ? 2.5 : 2}
            />
            <span className={cn(
              "text-[10px] font-medium",
              item.isActive && "font-semibold"
            )}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
