import React from 'react';
import { Link } from 'react-router-dom';
import { Globe2, Heart, Github } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border/80 bg-card py-12 mt-16">
      <div className="container grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
              <Globe2 className="h-4 w-4" />
            </div>
            <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
              CommonGround
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            A crowdsourced community challenge and collaborative problem-solving platform.
            Empowering citizens to post real societal issues, validate priorities, propose solutions,
            and track progress together.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
            Platform
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/explore" className="hover:text-foreground transition-colors">
                Explore Challenges
              </Link>
            </li>
            <li>
              <Link to="/challenges/new" className="hover:text-foreground transition-colors">
                Post a Challenge
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-foreground transition-colors">
                Impact & Analytics
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">
            Community
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
                <span>Open Source</span>
              </a>
            </li>
            <li>
              <span className="text-xs text-muted-foreground">Built for communities worldwide</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="container mt-8 pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
        <p>© {new Date().getFullYear()} CommonGround Platform. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Crafted with <Heart className="h-3.5 w-3.5 text-rose-500 fill-current" /> for civic empowerment.
        </p>
      </div>
    </footer>
  );
};
