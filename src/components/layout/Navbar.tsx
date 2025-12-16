
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const { user, signOut, loading } = useAuth();

  return (
    <header className="border-b sticky top-0 z-50 bg-white overflow-hidden">
      <div className="container mx-auto flex items-center justify-between py-4 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="text-2xl transform scale-x-[-1]">🏃‍♀️</div>
          <span className="text-xl font-bold text-camps-dark">KidFun</span>
        </Link>

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
                <Link to="/auth?tab=signin">Log In</Link>
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
