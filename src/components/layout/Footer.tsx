
import React from "react";
import { Link } from "react-router-dom";
import { Download } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-100 border-t pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center">
          <div>
            <h3 className="font-bold text-lg mb-4 text-center">Get the App</h3>
            <ul className="space-y-2 text-center">
              <li>
                <Link to="/install" className="text-gray-600 hover:text-primary transition-colors inline-flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Install KidFun
                </Link>
              </li>
              <li><span className="text-gray-600 cursor-default">iOS & Android</span></li>
              <li><span className="text-gray-600 cursor-default">Works Offline</span></li>
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
