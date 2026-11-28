import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Check, Compass, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChallengeCard } from '@/components/ChallengeCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useChallenges } from '@/api/challenges';
import { useStats } from '@/api/stats';

export const Landing: React.FC = () => {
  const { data: challengesData, isLoading: challengesLoading } = useChallenges({ ordering: '-support_count' });
  const { data: stats } = useStats();
  const featured = challengesData?.results?.slice(0, 3) || [];
  const lead = featured[0];

  return (
    <div className="pb-20">
      <section className="relative overflow-hidden border-b border-border/70">
        <div className="container grid gap-12 px-4 pb-14 pt-14 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-16 md:pb-20 md:pt-20">
          <div className="relative z-10 max-w-2xl space-y-7">
            <div className="eyebrow inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-2">
              <span className="h-2 w-2 rounded-full bg-accent ring-4 ring-accent/10" />
              Community, in motion
            </div>
            <h1 className="max-w-[12ch] text-[3.45rem] leading-[0.99] text-foreground sm:text-6xl lg:text-[5.2rem]">
              Better places <span className="text-primary italic">start</span> together.
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground md:text-lg md:leading-8">
              Notice something your neighborhood could do better? Bring people together, shape a practical plan, and see the work through.
            </p>
            <div className="flex flex-col gap-3 pt-1 sm:flex-row">
              <Link to="/explore">
                <Button size="lg" className="w-full gap-2 rounded-full px-6 sm:w-auto">
                  <Compass className="h-4 w-4" /> Explore nearby challenges <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/challenges/new">
                <Button size="lg" variant="outline" className="w-full gap-2 rounded-full px-6 sm:w-auto">
                  <Plus className="h-4 w-4" /> Share a local issue
                </Button>
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Built around real local needs</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> Progress stays visible</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px] md:ml-auto">
            <div className="absolute -right-4 -top-7 h-32 w-32 rounded-full border border-accent/20" />
            <div className="absolute -bottom-8 -left-7 h-28 w-28 rounded-full border border-primary/20" />
            <div className="relative overflow-hidden rounded-[1.4rem] border border-border/80 bg-[#e8e4d7] p-3 shadow-[0_28px_80px_-46px_hsl(var(--foreground)/0.45)] dark:bg-[#25362e]">
              <div className="relative min-h-[310px] overflow-hidden rounded-[1rem] bg-[#dfe6d5] dark:bg-[#34483b] sm:min-h-[380px]">
                <svg viewBox="0 0 560 390" className="absolute inset-0 h-full w-full" role="img" aria-label="Illustrated neighborhood street map">
                  <path d="M-20 95 C110 115 190 80 290 105 S455 144 600 105" fill="none" stroke="hsl(var(--background))" strokeWidth="28" />
                  <path d="M60 -20 C85 90 125 140 111 235 S87 337 105 420" fill="none" stroke="hsl(var(--background))" strokeWidth="23" />
                  <path d="M380 -20 C355 70 390 160 365 235 S338 332 360 420" fill="none" stroke="hsl(var(--background))" strokeWidth="25" />
                  <path d="M-20 288 C112 258 203 287 309 278 S483 249 600 282" fill="none" stroke="hsl(var(--background))" strokeWidth="20" />
                  <path d="M-20 95 C110 115 190 80 290 105 S455 144 600 105" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
                  <path d="M60 -20 C85 90 125 140 111 235 S87 337 105 420" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
                  <path d="M380 -20 C355 70 390 160 365 235 S338 332 360 420" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
                  <path d="M-20 288 C112 258 203 287 309 278 S483 249 600 282" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
                  <rect x="173" y="145" width="142" height="85" rx="16" fill="hsl(var(--primary))" opacity=".12" />
                  <path d="M218 192 C245 155 270 220 294 174" fill="none" stroke="hsl(var(--primary))" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 10" />
                  <circle cx="218" cy="192" r="8" fill="hsl(var(--accent))" />
                  <circle cx="294" cy="174" r="8" fill="hsl(var(--primary))" />
                  <circle cx="218" cy="192" r="15" fill="none" stroke="hsl(var(--accent))" opacity=".28" strokeWidth="5" />
                  <circle cx="294" cy="174" r="15" fill="none" stroke="hsl(var(--primary))" opacity=".25" strokeWidth="5" />
                  <g fill="hsl(var(--primary))" opacity=".13">
                    <rect x="145" y="35" width="60" height="29" rx="7"/><rect x="220" y="32" width="92" height="32" rx="7"/>
                    <rect x="418" y="52" width="78" height="31" rx="7"/><rect x="143" y="323" width="82" height="28" rx="7"/>
                    <rect x="407" y="314" width="80" height="30" rx="7"/><rect x="420" y="161" width="68" height="31" rx="7"/>
                  </g>
                </svg>
                <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-card/85 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-foreground shadow-sm backdrop-blur">
                  <Sparkles className="h-3 w-3 text-accent" /> A map of shared effort
                </div>
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-border/80 bg-card/95 p-4 shadow-xl backdrop-blur sm:bottom-5 sm:left-5 sm:right-5 sm:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="eyebrow mb-2">On the neighborhood board</p>
                      <h2 className="font-display text-2xl leading-tight text-foreground sm:text-[1.75rem]">{lead?.title || 'A safer walk to the bus stop'}</h2>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> {lead?.location || 'A local challenge, ready for neighbors'}</p>
                    </div>
                    <Link to={lead ? `/challenges/${lead.id}` : '/explore'} aria-label="Open featured challenge" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary transition-transform hover:-translate-y-0.5">
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-3 text-xs">
                    <span className="font-medium text-muted-foreground">One observation can start a movement.</span>
                    <span className="font-bold text-primary">{lead?.support_count ?? 0} neighbors</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -right-2 top-1/2 hidden -translate-y-1/2 rounded-2xl border border-border bg-card px-4 py-3 shadow-lg lg:block">
              <p className="eyebrow">Ideas in action</p><p className="mt-1 font-display text-3xl">{stats?.resolved_count ?? 0}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container px-4 pt-2">
        <div className="grid grid-cols-1 border-y border-border/80 sm:grid-cols-3">
          <div className="flex items-center gap-4 py-5 sm:py-6 sm:pr-8">
            <span className="font-display text-4xl text-primary">{stats?.total_challenges ?? 0}</span>
            <span className="max-w-24 text-xs leading-5 text-muted-foreground">local issues brought into view</span>
          </div>
          <div className="flex items-center gap-4 border-y border-border/80 py-5 sm:border-x sm:border-y-0 sm:px-8 sm:py-6">
            <span className="font-display text-4xl text-primary">{stats?.total_solutions ?? 0}</span>
            <span className="max-w-24 text-xs leading-5 text-muted-foreground">ideas shaped into practical plans</span>
          </div>
          <div className="flex items-center gap-4 py-5 sm:pl-8 sm:py-6">
            <span className="font-display text-4xl text-accent">{stats?.resolved_count ?? 0}</span>
            <span className="max-w-24 text-xs leading-5 text-muted-foreground">challenges with a recorded outcome</span>
          </div>
        </div>
      </section>

      <section className="container space-y-8 px-4 pt-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div className="max-w-xl space-y-2"><p className="eyebrow">From around the corner</p><h2 className="text-4xl leading-tight sm:text-5xl">Work already underway.</h2><p className="text-sm leading-6 text-muted-foreground">Real needs, considered ideas, neighbors showing up.</p></div>
          <Link to="/explore" className="inline-flex items-center gap-2 pb-1 text-sm font-bold text-primary hover:text-accent">Browse the board <ArrowRight className="h-4 w-4" /></Link>
        </div>
        {challengesLoading ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((i) => <div key={i} className="h-80 rounded-2xl border border-border bg-card p-5"><Skeleton className="mb-6 h-5 w-1/3"/><Skeleton className="mb-4 h-32 w-full"/><Skeleton className="h-6 w-3/4"/></div>)}</div> : featured.length > 0 ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{featured.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} />)}</div> : <p className="py-10 text-sm text-muted-foreground">No challenges yet. The first one can start here.</p>}
      </section>

      <section className="container px-4 pt-3">
        <div className="grid gap-10 border-t border-border/80 pt-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20 lg:pt-14">
          <div className="space-y-3"><p className="eyebrow">A little structure. A lot of possibility.</p><h2 className="max-w-md text-4xl leading-tight sm:text-5xl">Make it easier to move from concern to change.</h2><p className="max-w-md text-sm leading-6 text-muted-foreground">Good local work starts with listening, gets stronger with a plan, and lasts when people can see what happened.</p></div>
          <div className="divide-y divide-border/80 border-y border-border/80">
            <div className="grid grid-cols-[50px_1fr] gap-4 py-5 sm:grid-cols-[72px_1fr] sm:py-6"><span className="font-display text-3xl text-accent">01</span><div><h3 className="text-2xl">Name what needs attention.</h3><p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">Share what is happening, where it is happening, and who is affected. Neighbors help make the priority visible.</p></div></div>
            <div className="grid grid-cols-[50px_1fr] gap-4 py-5 sm:grid-cols-[72px_1fr] sm:py-6"><span className="font-display text-3xl text-accent">02</span><div><h3 className="text-2xl">Shape a plan together.</h3><p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">Compare proposals, ask questions, offer time or resources, and agree on who can carry the work forward.</p></div></div>
            <div className="grid grid-cols-[50px_1fr] gap-4 py-5 sm:grid-cols-[72px_1fr] sm:py-6"><span className="font-display text-3xl text-accent">03</span><div><h3 className="text-2xl">Keep the outcome in view.</h3><p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">Track milestones as work happens and record what it took, so the next community starts with more knowledge.</p></div></div>
          </div>
        </div>
      </section>

      <section className="container px-4 pt-3">
        <div className="relative overflow-hidden rounded-[1.5rem] bg-primary px-6 py-10 text-primary-foreground sm:px-10 sm:py-14">
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full border border-primary-foreground/10" />
          <div className="absolute -right-4 -top-12 h-48 w-48 rounded-full border border-primary-foreground/10" />
          <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl space-y-3"><p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-foreground/70">Start close to home</p><h2 className="font-display text-4xl leading-tight sm:text-5xl">What could we make better, together?</h2><p className="max-w-lg text-sm leading-6 text-primary-foreground/75">Bring a local issue into the open. The next useful idea might come from your neighbor.</p></div>
            <div className="flex flex-col gap-3 sm:flex-row"><Link to="/challenges/new"><Button variant="cta" size="lg" className="w-full rounded-full px-6 sm:w-auto">Share a challenge <Plus className="ml-1 h-4 w-4" /></Button></Link><Link to="/spaces"><Button size="lg" variant="secondary" className="w-full rounded-full bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 sm:w-auto">Find your people</Button></Link></div>
          </div>
        </div>
      </section>
    </div>
  );
};
