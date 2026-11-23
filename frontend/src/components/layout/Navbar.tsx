import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Compass,
  BarChart3,
  PlusCircle,
  Sun,
  Moon,
  Menu,
  LogOut,
  User as UserIcon,
  Globe2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { NotificationBell } from '../NotificationBell';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { label: 'Explore', path: '/explore', icon: Compass },
    { label: 'Impact', path: '/dashboard', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-primary/25 transition-transform group-hover:scale-105">
              <Globe2 className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
              CommonGround
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-muted text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right CTA & Controls */}
        <div className="flex items-center gap-2">
          {/* Create Challenge Button */}
          <Link to="/challenges/new" className="hidden sm:inline-flex">
            <Button size="sm" variant="cta" className="gap-2 shadow-sm rounded-xl">
              <PlusCircle className="h-4 w-4" />
              <span>Post Challenge</span>
            </Button>
          </Link>

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* Notification Bell */}
          <NotificationBell />

          {/* Auth State */}
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-primary/20 transition-all focus:outline-none"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs uppercase">
                      {user.username?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-1.5">
                <DropdownMenuLabel className="p-2">
                  <p className="text-sm font-bold text-foreground truncate">{user.username}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email || 'Citizen Contributor'}</p>
                  <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    Reputation: {user.reputation}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(`/profile/${user.username}`)} className="cursor-pointer gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/notifications')} className="cursor-pointer gap-2">
                  <NotificationBell />
                  <span>Notifications</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="rounded-xl">
                  Sign in
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="default" size="sm" className="rounded-xl shadow-sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Trigger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex md:hidden h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-left font-bold text-lg">Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-3 mt-6">
                <Link
                  to="/explore"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                >
                  <Compass className="h-4 w-4" />
                  Explore Challenges
                </Link>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                >
                  <BarChart3 className="h-4 w-4" />
                  Impact Dashboard
                </Link>
                <Link
                  to="/challenges/new"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium bg-amber-500 text-white font-semibold"
                >
                  <PlusCircle className="h-4 w-4" />
                  Post Challenge
                </Link>

                <div className="pt-4 border-t border-border/80 flex flex-col gap-2">
                  {isAuthenticated && user ? (
                    <>
                      <Link
                        to={`/profile/${user.username}`}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium hover:bg-muted"
                      >
                        <UserIcon className="h-4 w-4" />
                        My Profile
                      </Link>
                      <button
                        type="button"
                        onClick={() => {
                          setMobileOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 text-left"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        onClick={() => setMobileOpen(false)}
                        className="w-full text-center py-2 text-sm font-semibold border rounded-xl"
                      >
                        Sign in
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setMobileOpen(false)}
                        className="w-full text-center py-2 text-sm font-semibold bg-primary text-white rounded-xl"
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
