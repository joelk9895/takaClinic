import { useAuth } from '../lib/authContext';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getUserData } from '../lib/firebaseService';

const NavBar = () => {
  const { user, logout } = useAuth();
  const [userRole, setUserRole] = useState<'admin' | 'doctor' | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (user) {
      // Fetch user role from Firestore
      getUserData(user.uid)
        .then(userData => {
          setUserRole(userData.role as 'admin' | 'doctor');
        })
        .catch(err => {
          console.error('Error fetching user role:', err);
          // Default to doctor role if there's an error
          setUserRole('doctor');
        });
    } else {
      setUserRole(null);
    }
  }, [user]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white backdrop-blur-lg bg-opacity-80 border-b border-neutral-200 py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 flex items-center justify-center text-white font-bold">
            T
          </div>
          <span className="text-xl font-bold font-plus-jakarta text-neutral-800">
            Taka Clinic
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {user ? (
            <>
              {userRole === 'admin' && (
                <div className="flex items-center space-x-6">
                  <Link href="/admin" className="text-neutral-600 hover:text-primary-600 transition-colors text-sm font-medium">
                    Dashboard
                  </Link>
                  <Link href="/analytics" className="text-neutral-600 hover:text-primary-600 transition-colors text-sm font-medium">
                    Analytics
                  </Link>
                  <Link href="/financials" className="text-neutral-600 hover:text-primary-600 transition-colors text-sm font-medium">
                    Financials
                  </Link>
                </div>
              )}
              
              <div className="flex items-center space-x-3">
                {userRole && (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    userRole === 'admin' 
                      ? 'bg-purple-100 text-purple-700' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {userRole === 'admin' ? 'Admin' : 'Doctor'}
                  </span>
                )}
                
                <button
                  onClick={() => logout()}
                  className="btn-secondary text-sm py-1.5 px-3"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link 
                href="/login"
                className="text-neutral-600 hover:text-primary-600 transition-colors text-sm font-medium"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="btn-primary text-sm py-1.5 px-4"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden p-2 rounded-md text-neutral-600 hover:text-primary-600 hover:bg-neutral-100 transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div 
          ref={menuRef}
          className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-neutral-200 shadow-lg animate-slideInUp"
        >
          <div className="px-4 py-3 space-y-3">
            {user ? (
              <>
                {userRole === 'admin' && (
                  <div className="space-y-3 py-2 border-b border-neutral-200">
                    <Link 
                      href="/admin" 
                      className="block text-neutral-600 hover:text-primary-600 transition-colors text-sm font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link 
                      href="/analytics" 
                      className="block text-neutral-600 hover:text-primary-600 transition-colors text-sm font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Analytics
                    </Link>
                    <Link 
                      href="/financials" 
                      className="block text-neutral-600 hover:text-primary-600 transition-colors text-sm font-medium"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Financials
                    </Link>
                  </div>
                )}
                
                <div className="flex items-center justify-between py-2">
                  {userRole && (
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      userRole === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {userRole === 'admin' ? 'Admin' : 'Doctor'}
                    </span>
                  )}
                  
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="btn-secondary text-sm py-1.5 px-3"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col space-y-3 py-2">
                <Link 
                  href="/login"
                  className="text-neutral-600 hover:text-primary-600 transition-colors text-sm font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="btn-primary text-sm py-1.5 px-4 text-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
