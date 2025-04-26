
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Search, User, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="border-b sticky top-0 z-50 bg-white">
      <div className="container mx-auto flex items-center justify-between py-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-full bg-camps-primary flex items-center justify-center">
            <Calendar className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold text-camps-dark">CampFinder</span>
        </Link>

        {/* Search Bar */}
        <div className="hidden md:flex items-center max-w-md w-full mx-4 relative">
          <Input
            type="text"
            placeholder="Search camps and activities..."
            className="w-full pr-10 rounded-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute right-3 h-4 w-4 text-gray-400" />
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center space-x-4">
          <Link to="/camps" className="text-camps-dark hover:text-camps-primary font-medium">
            Camps
          </Link>
          <Link to="/activities" className="text-camps-dark hover:text-camps-primary font-medium">
            Activities
          </Link>
          <Link to="/hosts" className="hidden md:inline-block text-camps-dark hover:text-camps-primary font-medium">
            Become a Host
          </Link>
          <Button variant="outline" size="sm" className="rounded-full">
            <User className="h-4 w-4 mr-2" />
            <span className="hidden md:inline">Account</span>
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
