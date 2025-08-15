
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="border-b sticky top-0 z-50 bg-white">
      <div className="container mx-auto flex items-center justify-between py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="text-2xl">🧒</div>
          <span className="text-xl font-bold text-camps-dark">KidApp</span>
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
          <Button variant="ghost" size="sm" className="rounded-full">
            Log In
          </Button>
          <Button variant="default" size="sm" className="rounded-full">
            Sign Up
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
