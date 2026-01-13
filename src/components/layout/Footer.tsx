
import React from "react";
import { Link } from "react-router-dom";
import { Download } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-100 border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li><span className="text-gray-600 cursor-default">Help Center</span></li>
              <li><span className="text-gray-600 cursor-default">Safety Information</span></li>
              <li><span className="text-gray-600 cursor-default">Cancellation Options</span></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Community</h3>
            <ul className="space-y-2">
              <li><span className="text-gray-600 cursor-default">Parents Community</span></li>
              <li><span className="text-gray-600 cursor-default">Activity Providers</span></li>
              <li><span className="text-gray-600 cursor-default">Testimonials</span></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">Get the App</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/install" className="text-gray-600 hover:text-primary transition-colors flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Install KidFun
                </Link>
              </li>
              <li><span className="text-gray-600 cursor-default">iOS & Android</span></li>
              <li><span className="text-gray-600 cursor-default">Works Offline</span></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4">About</h3>
            <ul className="space-y-2">
              <li><span className="text-gray-600 cursor-default">Our Story</span></li>
              <li><span className="text-gray-600 cursor-default">Safety Commitment</span></li>
              <li><span className="text-gray-600 cursor-default">Careers</span></li>
              <li><span className="text-gray-600 cursor-default">Press</span></li>
            </ul>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm mb-4 md:mb-0">© 2025 KidFun, Inc. All rights reserved.</p>
          <div className="flex space-x-6">
            <span className="text-gray-600 text-sm cursor-default">Privacy</span>
            <span className="text-gray-600 text-sm cursor-default">Terms</span>
            <span className="text-gray-600 text-sm cursor-default">Sitemap</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
