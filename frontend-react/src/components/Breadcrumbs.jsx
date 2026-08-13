import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeNames = {
  app: 'Dashboard',
  family: 'Family Hub',
  records: 'Medical Records',
  symptoms: 'AI Triage & Symptoms',
  medicine: 'Medication Manager',
  emergency: 'Emergency SOS',
  appointments: 'Appointments',
  nutrition: 'Nutrition & Diet',
  fitness: 'Fitness Coach',
  settings: 'Security & Settings',
  tracker: 'Smart Trackers',
};

const Breadcrumbs = ({ customItems }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // If custom items are provided, use them (e.g., for /privacy)
  if (customItems) {
    return (
      <nav className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-6 px-1" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-2">
          <li className="inline-flex items-center">
            <Link to="/" className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <Home className="w-3.5 h-3.5 mr-1.5" />
              Home
            </Link>
          </li>
          {customItems.map((item, index) => (
            <li key={index} className="flex items-center">
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 mx-1" />
              {item.path ? (
                <Link to={item.path} className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  // Only render auto-breadcrumbs inside /app subpages
  if (pathnames.length <= 1 || pathnames[0] !== 'app') {
    return null;
  }

  return (
    <nav className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-4 px-1" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        <li className="inline-flex items-center">
          <Link
            to="/app"
            className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <Home className="w-3.5 h-3.5 mr-1.5" />
            Dashboard
          </Link>
        </li>

        {pathnames.slice(1).map((name, index) => {
          const routeTo = `/app/${pathnames.slice(1, index + 2).join('/')}`;
          const isLast = index === pathnames.length - 2;
          const displayName = routeNames[name] || name.charAt(0).toUpperCase() + name.slice(1);

          return (
            <li key={name} className="flex items-center">
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 mx-1" />
              {isLast ? (
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {displayName}
                </span>
              ) : (
                <Link
                  to={routeTo}
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {displayName}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
