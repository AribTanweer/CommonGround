import React, { useState } from 'react';
import { CalendarDays, CheckCircle2, Circle, HandHelping, Package, MessageCircleQuestion, Target, Users } from 'lucide-react';
import { Solution } from '@/api/types';
import { useAnswerSolutionQuestion, useAskSolutionQuestion, useCreateMilestone, useOfferResource, useResourceOffers, useRetractResource, useSignUpToVolunteer, useSolutionMilestones, useSolutionQuestions, useUpdateMilestone, useUpdateSolutionOutcome, useUpdateSolutionProgress, useVolunteerSignups, useWithdrawVolunteer } from '@/api/solutions';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

interface Props { solution: Solution; challengeId: number; challengeOwnerId?: number; challengeResolved: boolean }

export const SolutionCoordinationPanel: React.FC<Props> = ({ solution, challengeId, challengeOwnerId, challengeResolved }) => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const canManage = user?.id === challengeOwnerId || user?.id === solution.author.id;
  const milestones = useSolutionMilestones(solution.id);
  const volunteers = useVolunteerSignups(solution.id);
  const resources = useResourceOffers(solution.id);
  const questions = useSolutionQuestions(solution.id);
  const createMilestone = useCreateMilestone(solution.id);
  const updateMilestone = useUpdateMilestone(solution.id);
  const signUp = useSignUpToVolunteer(solution.id);
  const withdrawVolunteer = useWithdrawVolunteer(solution.id);
  const offerResource = useOfferResource(solution.id);
  const retractResource = useRetractResource(solution.id);
  const askQuestion = useAskSolutionQuestion(solution.id);
  const answerQuestion = useAnswerSolutionQuestion(solution.id);
  const updateProgress = useUpdateSolutionProgress(solution.id, challengeId);
  const updateOutcome = useUpdateSolutionOutcome(solution.id, challengeId);
  const [lead, setLead] = useState(solution.responsible_party || '');
  const [targetDate, setTargetDate] = useState(solution.target_date || '');
  const [milestoneTitle, setMilestoneTitle] = useState('');
  const [milestoneDate, setMilestoneDate] = useState('');
  const [volunteerRole, setVolunteerRole] = useState('');
  const [volunteerNote, setVolunteerNote] = useState('');
  const [resourceName, setResourceName] = useState('');
  const [resourceDetails, setResourceDetails] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [outcomeNotes, setOutcomeNotes] = useState(solution.outcome_notes || '');
  const [actualCost, setActualCost] = useState(solution.actual_cost || '');
  const [durationDays, setDurationDays] = useState(solution.duration_days?.toString() || '');
  const [evidenceUrl, setEvidenceUrl] = useState(solution.outcome_evidence_url || '');

  const reportSuccess = (title: string) => toast({ title, variant: 'success' });

  return <section className="mt-5 space-y-5 border-t border-border/70 pt-5" aria-label="Solution coordination and outcome">
    <div className="flex items-center gap-2"><Target className="h-4 w-4 text-primary" /><h3 className="font-bold">Delivery plan</h3></div>
    {isAuthenticated && !user?.is_email_verified && <p className="text-xs text-muted-foreground">Verify your email to volunteer, offer resources, or ask the solution author a question.</p>}
    {(solution.responsible_party || solution.target_date) && <p className="text-sm text-muted-foreground">Lead: <strong className="text-foreground">{solution.responsible_party || 'Not assigned'}</strong>{solution.target_date && <> · Target {new Date(`${solution.target_date}T00:00:00`).toLocaleDateString()}</>}</p>}
    {canManage && <form className="grid gap-2 sm:grid-cols-[1fr_180px_auto]" onSubmit={(event) => {
      event.preventDefault();
      updateProgress.mutate({ responsible_party: lead.trim(), target_date: targetDate || null }, { onSuccess: () => reportSuccess('Delivery lead and target saved') });
    }}>
      <div className="space-y-1"><Label htmlFor={`lead-${solution.id}`} className="text-xs">Responsible person or organization</Label><Input id={`lead-${solution.id}`} value={lead} onChange={(e) => setLead(e.target.value)} maxLength={120} placeholder="e.g. Green Streets Collective" /></div>
      <div className="space-y-1"><Label htmlFor={`target-${solution.id}`} className="text-xs">Target date</Label><Input id={`target-${solution.id}`} type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></div>
      <Button type="submit" variant="outline" className="self-end" disabled={updateProgress.isPending}>Save plan</Button>
    </form>}

    <div className="rounded-xl bg-muted/30 p-4 space-y-3">
      <h4 className="flex items-center gap-2 text-sm font-semibold"><CalendarDays className="h-4 w-4" />Milestones</h4>
      {(milestones.data || []).map((milestone) => <div key={milestone.id} className="flex items-center gap-2 text-sm">
        {canManage ? <button type="button" aria-label={milestone.is_complete ? 'Mark milestone incomplete' : 'Complete milestone'} onClick={() => updateMilestone.mutate({ milestoneId: milestone.id, is_complete: !milestone.is_complete })} className="text-primary">{milestone.is_complete ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}</button> : <span className="text-primary">{milestone.is_complete ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}</span>}
        <span className={milestone.is_complete ? 'text-muted-foreground line-through' : ''}>{milestone.title}</span>{milestone.due_date && <span className="ml-auto text-xs text-muted-foreground">{new Date(`${milestone.due_date}T00:00:00`).toLocaleDateString()}</span>}
      </div>)}
      {canManage && <form className="grid gap-2 sm:grid-cols-[1fr_170px_auto]" onSubmit={(event) => { event.preventDefault(); createMilestone.mutate({ title: milestoneTitle.trim(), due_date: milestoneDate || undefined }, { onSuccess: () => { setMilestoneTitle(''); setMilestoneDate(''); } }); }}>
        <Input aria-label="New milestone" value={milestoneTitle} onChange={(e) => setMilestoneTitle(e.target.value)} placeholder="Add a milestone" required maxLength={160} />
        <Input aria-label="Milestone target date" type="date" value={milestoneDate} onChange={(e) => setMilestoneDate(e.target.value)} />
        <Button type="submit" size="sm" variant="outline" disabled={createMilestone.isPending}>Add</Button>
      </form>}
      {!milestones.data?.length && <p className="text-xs text-muted-foreground">No milestones yet. Break the plan into small, trackable steps.</p>}
    </div>

    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-xl border border-border/70 p-4 space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold"><HandHelping className="h-4 w-4 text-primary" />Volunteer sign-ups <span className="text-muted-foreground">({volunteers.data?.length || 0})</span></h4>
        {volunteers.data?.map((item) => <div key={item.id} className="flex items-start justify-between gap-2 text-xs"><p><strong>{item.user.username}</strong> · {item.contribution}{item.note && <span className="block text-muted-foreground">{item.note}</span>}</p>{item.user.id === user?.id && <button type="button" className="shrink-0 text-muted-foreground hover:text-destructive" disabled={withdrawVolunteer.isPending} onClick={() => withdrawVolunteer.mutate(item.id, { onSuccess: () => toast({ title: 'Volunteer sign-up withdrawn' }) })}>Withdraw</button>}</div>)}
        {isAuthenticated && user?.is_email_verified && !volunteers.data?.some((item) => item.user.id === user?.id) && <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); signUp.mutate({ contribution: volunteerRole.trim(), note: volunteerNote.trim() }, { onSuccess: () => { setVolunteerRole(''); setVolunteerNote(''); reportSuccess('You signed up to help'); } }); }}>
          <Input aria-label="How you can volunteer" required maxLength={160} value={volunteerRole} onChange={(e) => setVolunteerRole(e.target.value)} placeholder="How can you help?" />
          <Input aria-label="Volunteer note" maxLength={500} value={volunteerNote} onChange={(e) => setVolunteerNote(e.target.value)} placeholder="Availability or details (optional)" />
          <Button size="sm" variant="outline" disabled={signUp.isPending}>Sign up</Button>
        </form>}
      </div>
      <div className="rounded-xl border border-border/70 p-4 space-y-3">
        <h4 className="flex items-center gap-2 text-sm font-semibold"><Package className="h-4 w-4 text-primary" />Resource offers <span className="text-muted-foreground">({resources.data?.length || 0})</span></h4>
        {resources.data?.map((item) => <div key={item.id} className="flex items-start justify-between gap-2 text-xs"><p><strong>{item.user.username}</strong> · {item.resource}{item.details && <span className="block text-muted-foreground">{item.details}</span>}</p>{item.user.id === user?.id && <button type="button" className="shrink-0 text-muted-foreground hover:text-destructive" disabled={retractResource.isPending} onClick={() => retractResource.mutate(item.id, { onSuccess: () => toast({ title: 'Resource offer withdrawn' }) })}>Remove</button>}</div>)}
        {isAuthenticated && user?.is_email_verified && <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); offerResource.mutate({ resource: resourceName.trim(), details: resourceDetails.trim() }, { onSuccess: () => { setResourceName(''); setResourceDetails(''); reportSuccess('Resource offer shared'); } }); }}>
          <Input aria-label="Resource you can offer" required maxLength={160} value={resourceName} onChange={(e) => setResourceName(e.target.value)} placeholder="What can you offer?" />
          <Input aria-label="Resource details" maxLength={500} value={resourceDetails} onChange={(e) => setResourceDetails(e.target.value)} placeholder="Quantity, timing, or details" />
          <Button size="sm" variant="outline" disabled={offerResource.isPending}>Offer resource</Button>
        </form>}
      </div>
    </div>

    <div className="rounded-xl border border-border/70 p-4 space-y-3">
      <h4 className="flex items-center gap-2 text-sm font-semibold"><MessageCircleQuestion className="h-4 w-4 text-primary" />Questions for the solution author</h4>
      {questions.data?.map((item) => <div key={item.id} className="rounded-lg bg-muted/30 p-3 text-sm"><p><strong>{item.author.username} asks:</strong> {item.question}</p>{item.answer ? <p className="mt-2 border-l-2 border-primary/40 pl-3 text-muted-foreground"><strong>{solution.author.username}:</strong> {item.answer}</p> : user?.id === solution.author.id ? <form className="mt-2 flex gap-2" onSubmit={(event) => { event.preventDefault(); answerQuestion.mutate({ questionId: item.id, answer: answers[item.id]?.trim() || '' }, { onSuccess: () => { setAnswers((old) => ({ ...old, [item.id]: '' })); reportSuccess('Answer posted'); } }); }}><Input aria-label="Answer question" required value={answers[item.id] || ''} onChange={(e) => setAnswers((old) => ({ ...old, [item.id]: e.target.value }))} placeholder="Write an answer" /><Button size="sm" disabled={answerQuestion.isPending}>Reply</Button></form> : <p className="mt-2 text-xs text-muted-foreground">Awaiting an answer</p>}</div>)}
      {isAuthenticated && user?.is_email_verified && <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); askQuestion.mutate({ question: questionText.trim() }, { onSuccess: () => { setQuestionText(''); reportSuccess('Question sent to the solution author'); } }); }}><Input aria-label="Ask the solution author a question" value={questionText} onChange={(e) => setQuestionText(e.target.value)} required maxLength={500} placeholder="Ask a clear, specific question" /><Button variant="outline" disabled={askQuestion.isPending}>Ask</Button></form>}
    </div>

    {(solution.outcome_notes || solution.actual_cost || solution.duration_days != null || (canManage && challengeResolved)) && <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 space-y-3">
      <h4 className="flex items-center gap-2 text-sm font-bold"><CheckCircle2 className="h-4 w-4 text-emerald-600" />What happened</h4>
      {!canManage || !challengeResolved ? <div className="space-y-1 text-sm"><p>{solution.outcome_notes || 'Outcome notes have not been recorded yet.'}</p><p className="text-xs text-muted-foreground">{solution.duration_days != null && `${solution.duration_days} days`}{solution.duration_days != null && solution.actual_cost && ' · '}{solution.actual_cost && `Actual cost: ${solution.actual_cost}`}</p>{solution.outcome_evidence_url && <a className="text-xs font-semibold text-primary hover:underline" href={solution.outcome_evidence_url} target="_blank" rel="noreferrer">View outcome evidence</a>}</div> : <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); updateOutcome.mutate({ outcome_notes: outcomeNotes.trim(), actual_cost: actualCost.trim(), duration_days: durationDays ? Number(durationDays) : solution.duration_days, outcome_evidence_url: evidenceUrl.trim() }, { onSuccess: () => reportSuccess('Outcome learning saved') }); }}>
        <Textarea aria-label="Outcome notes" required value={outcomeNotes} onChange={(e) => setOutcomeNotes(e.target.value)} placeholder="What worked, what changed, and what should future neighbors know?" rows={3} />
        <div className="grid gap-2 sm:grid-cols-2"><div><Label className="text-xs" htmlFor={`actual-cost-${solution.id}`}>Actual cost</Label><Input id={`actual-cost-${solution.id}`} value={actualCost} onChange={(e) => setActualCost(e.target.value)} placeholder="e.g. $1,250 or donated" /></div><div><Label className="text-xs" htmlFor={`duration-${solution.id}`}>Time to complete (days)</Label><Input id={`duration-${solution.id}`} type="number" min="0" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} placeholder={solution.duration_days?.toString() || 'e.g. 42'} /></div></div>
        <Input aria-label="Outcome evidence URL" type="url" value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} placeholder="Link to a report or evidence (optional)" />
        <Button size="sm" disabled={updateOutcome.isPending}>Save outcome</Button>
      </form>}
      {!challengeResolved && <p className="text-xs text-muted-foreground">Outcome reporting opens when the challenge is marked resolved.</p>}
    </div>}
    {!isAuthenticated && <p className="text-xs text-muted-foreground"><Users className="mr-1 inline h-3.5 w-3.5" />Sign in to volunteer, offer resources, or ask a question.</p>}
  </section>;
};
