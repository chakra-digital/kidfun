
import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-100 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li><Link to="/help" className="text-gray-600 hover:text-camps-primary">Help Center</Link></li>
              <li><Link to="/safety" className="text-gray-600 hover:text-camps-primary">Safety Information</Link></li>
              <li><Link to="/cancellation" className="text-gray-600 hover:text-camps-primary">Cancellation Options</Link></li>
              <li><Link to="/covid" className="text-gray-600 hover:text-camps-primary">COVID-19 Guidelines</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Community</h3>
            <ul className="space-y-2">
              <li><Link to="/parents" className="text-gray-600 hover:text-camps-primary">Parents Community</Link></li>
              <li><Link to="/providers" className="text-gray-600 hover:text-camps-primary">Activity Providers</Link></li>
              <li><Link to="/testimonials" className="text-gray-600 hover:text-camps-primary">Testimonials</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Hosting</h3>
            <ul className="space-y-2">
              <li><Link to="/hosts" className="text-gray-600 hover:text-camps-primary">Become a Host</Link></li>
              <li><Link to="/resources" className="text-gray-600 hover:text-camps-primary">Host Resources</Link></li>
              <li><Link to="/certification" className="text-gray-600 hover:text-camps-primary">Get Certified</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">About</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-600 hover:text-camps-primary">Our Story</Link></li>
              <li><Link to="/safety-commitment" className="text-gray-600 hover:text-camps-primary">Safety Commitment</Link></li>
              <li><Link to="/careers" className="text-gray-600 hover:text-camps-primary">Careers</Link></li>
              <li><Link to="/press" className="text-gray-600 hover:text-camps-primary">Press</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm mb-4 md:mb-0">© 2025 CampFinder, Inc. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link to="/privacy" className="text-gray-600 hover:text-camps-primary text-sm">Privacy</Link>
            <Link to="/terms" className="text-gray-600 hover:text-camps-primary text-sm">Terms</Link>
            <Link to="/sitemap" className="text-gray-600 hover:text-camps-primary text-sm">Sitemap</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
