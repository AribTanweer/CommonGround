import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Users, LockKeyhole, Plus, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useAcceptSpaceInvitation, useCreateSpace, useInviteToSpace, useJoinSpace, useSpaceInvitations, useSpaces } from '@/api/challenges';
import { CommunitySpace } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const SpaceInvite: React.FC<{ space: CommunitySpace }> = ({ space }) => {
  const { toast } = useToast();
  const invite = useInviteToSpace(space.slug);
  const [username, setUsername] = useState('');
  return <form className="flex gap-2" onSubmit={(event) => {
    event.preventDefault();
    invite.mutate(username.trim(), {
      onSuccess: () => { setUsername(''); toast({ title: 'Invitation sent', variant: 'success' }); },
      onError: () => toast({ title: 'Invitation failed', description: 'Check that the username exists and try again.', variant: 'error' }),
    });
  }}>
    <Input aria-label={`Invite someone to ${space.name}`} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Invite by username" required />
    <Button type="submit" size="sm" variant="outline" disabled={invite.isPending}>Invite</Button>
  </form>;
};

export const Spaces: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const { data: spaces = [], isLoading } = useSpaces();
  const { data: invitations = [] } = useSpaceInvitations(isAuthenticated);
  const createSpace = useCreateSpace();
  const joinSpace = useJoinSpace();
  const acceptInvite = useAcceptSpaceInvitation();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'neighborhood' | 'organization'>('neighborhood');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const submitSpace = (event: React.FormEvent) => {
    event.preventDefault();
    createSpace.mutate({ name, kind, description, location, is_private: isPrivate }, {
      onSuccess: () => { setName(''); setDescription(''); setLocation(''); toast({ title: 'Space created', description: 'You are its first member.', variant: 'success' }); },
      onError: () => toast({ title: 'Could not create space', description: 'Check the details and try again.', variant: 'error' }),
    });
  };

  return <main className="container max-w-6xl py-12 px-4 space-y-10">
    <header className="max-w-2xl space-y-2">
      <p className="eyebrow">Work together, close to home</p>
      <h1 className="font-display text-4xl md:text-5xl leading-tight">Good work starts <em className="text-primary">nearby.</em></h1>
      <p className="text-sm md:text-base leading-relaxed text-muted-foreground">Create a neighborhood or organization space to coordinate challenges in context. Public spaces are discoverable; private spaces are visible only to members and invited people.</p>
    </header>

    {isAuthenticated && invitations.length > 0 && <section className="rounded-2xl border border-primary/25 bg-primary/5 p-5 space-y-3">
      <h2 className="font-bold">Invitations</h2>
      {invitations.map((invite) => <div key={invite.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card p-3">
        <p className="text-sm"><strong>{invite.space}</strong> <span className="text-muted-foreground">invited by {invite.invited_by}</span></p>
        <Button size="sm" disabled={acceptInvite.isPending || !user?.is_email_verified} title={!user?.is_email_verified ? 'Verify your email to join' : undefined} onClick={() => acceptInvite.mutate(invite.id)}><Check className="mr-1.5 h-4 w-4" />Accept</Button>
      </div>)}
    </section>}

    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-border/70 pb-3"><h2 className="font-display text-2xl">Spaces you can see</h2><span className="text-xs text-muted-foreground">{spaces.length} {spaces.length === 1 ? 'space' : 'spaces'}</span></div>
        {isLoading ? <p className="text-sm text-muted-foreground">Loading spaces…</p> : spaces.length === 0 ? <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">No public spaces yet. Start one for your neighborhood or organization.</div> : <div className="grid gap-4 sm:grid-cols-2">
          {spaces.map((space) => <article key={space.id} className="rounded-2xl border border-border/80 bg-card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{space.kind === 'organization' ? <Building2 className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}</div>{space.is_private && <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium"><LockKeyhole className="h-3 w-3" />Private</span>}</div>
            <div><h3 className="text-lg font-bold">{space.name}</h3><p className="mt-1 text-xs text-muted-foreground">{space.kind === 'organization' ? 'Organization' : 'Neighborhood'}{space.location ? ` · ${space.location}` : ''}</p></div>
            <p className="min-h-10 text-sm leading-relaxed text-muted-foreground">{space.description}</p>
            <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" />{space.member_count} members</span>{space.is_member ? <span className="font-semibold text-primary">Member</span> : <Button size="sm" variant="outline" disabled={space.is_private || joinSpace.isPending || !isAuthenticated || !user?.is_email_verified} title={!isAuthenticated ? 'Sign in to join' : !user?.is_email_verified ? 'Verify your email to join' : undefined} onClick={() => joinSpace.mutate(space.slug, { onSuccess: () => toast({ title: 'Joined space', variant: 'success' }) })}>{space.is_private ? 'Invite only' : 'Join space'}</Button>}</div>
            {space.is_member && <Link to={`/explore?space=${encodeURIComponent(space.slug)}`} className="block text-xs font-semibold text-primary hover:underline">Explore challenges in this space →</Link>}
            {isAuthenticated && user?.id === space.creator.id && <SpaceInvite space={space} />}
          </article>)}
        </div>}
      </section>

      <aside className="h-fit paper-panel p-5">
        <div className="mb-5 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Plus className="h-5 w-5" /></div><div><h2 className="font-bold">Create a space</h2><p className="text-xs text-muted-foreground">Start a shared local hub</p></div></div>
        {isAuthenticated ? <form onSubmit={submitSpace} className="space-y-4">
          <div className="space-y-1.5"><Label htmlFor="space-name">Name</Label><Input id="space-name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Eastside Neighbors" /></div>
          <div className="space-y-1.5"><Label htmlFor="space-kind">Space type</Label><select id="space-kind" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="neighborhood">Neighborhood</option><option value="organization">Organization</option></select></div>
          <div className="space-y-1.5"><Label htmlFor="space-location">Area or organization location</Label><Input id="space-location" maxLength={120} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" /></div>
          <div className="space-y-1.5"><Label htmlFor="space-description">What is this space for?</Label><Textarea id="space-description" required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <label className="flex gap-3 text-sm"><input type="checkbox" className="mt-0.5 accent-primary" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} /><span><strong>Private space</strong><span className="block text-xs text-muted-foreground">Only members can discover it or see associated challenges. Invite people from the space after it is created.</span></span></label>
          {!user?.is_email_verified && <p className="text-xs text-muted-foreground">Verify your email to create or join spaces.</p>}
          <Button className="w-full" disabled={createSpace.isPending || !user?.is_email_verified}>{createSpace.isPending ? 'Creating…' : 'Create space'}</Button>
        </form> : <p className="text-sm text-muted-foreground">Sign in to create or join a community space.</p>}
      </aside>
    </div>
  </main>;
};
