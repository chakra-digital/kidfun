
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { user, signOut, loading } = useAuth();

  return (
    <header className="border-b sticky top-0 z-50 bg-white">
      <div className="container mx-auto flex items-center justify-between py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="text-2xl transform scale-x-[-1]">🏃‍♀️</div>
          <span className="text-xl font-bold text-camps-dark">KidFun</span>
        </Link>

        {/* Search Bar */}
        <div className="flex items-center max-w-lg w-full mx-4 relative">
          <Input
            type="text"
            placeholder="Search camps, activities, tutors and more..."
            className="w-full pr-10 rounded-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute right-3 h-4 w-4 text-gray-400" />
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-2">
          {loading ? (
            <div className="h-8 w-16 bg-muted animate-pulse rounded-full" />
          ) : user ? (
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="rounded-full"
              >
                <Link to="/dashboard" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    {user.user_metadata?.first_name || user.email}
                  </span>
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={signOut}
                className="rounded-full"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Sign Out
              </Button>
            </div>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-full"
                asChild
              >
                <Link to="/auth">Log In</Link>
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="rounded-full"
                asChild
              >
                <Link to="/auth">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
