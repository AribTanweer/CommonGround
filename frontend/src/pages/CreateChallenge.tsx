import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Tag as TagIcon,
  MapPin,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Upload,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useCategories, useTags, useCreateChallenge, useSpaces } from '@/api/challenges';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const STEPS = [
  { index: 1, title: 'Details', icon: FileText, desc: 'Title & description' },
  { index: 2, title: 'Category & Tags', icon: TagIcon, desc: 'Classification' },
  { index: 3, title: 'Location & Image', icon: MapPin, desc: 'Visual & place' },
  { index: 4, title: 'Review', icon: CheckCircle, desc: 'Final check' },
];

export const CreateChallenge: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { data: categories = [] } = useCategories();
  const { data: tags = [] } = useTags();
  const { data: spaces = [] } = useSpaces();
  const createMutation = useCreateChallenge();

  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [location, setLocation] = useState('');
  const [spaceId, setSpaceId] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="container max-w-md py-20 text-center space-y-4">
        <Sparkles className="h-10 w-10 text-primary mx-auto" />
        <h2 className="text-xl font-bold">Sign In Required</h2>
        <p className="text-sm text-muted-foreground">
          You must be logged in to post a new community challenge.
        </p>
        <Link to="/login" state={{ from: { pathname: '/challenges/new' } }}>
          <Button variant="default">Sign In to Continue</Button>
        </Link>
      </div>
    );
  }

  const handleNext = () => {
    setError(null);
    if (currentStep === 1) {
      if (!title.trim() || !description.trim()) {
        setError('Please provide both a title and description for the challenge.');
        return;
      }
    } else if (currentStep === 2) {
      if (!selectedCategory) {
        setError('Please select a category for your challenge.');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrev = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const toggleTag = (tagId: number) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((id) => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    setError(null);
    if (!title || !description || !selectedCategory) {
      setError('Please fill in all required fields.');
      return;
    }

    const formData = new FormData();
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('category', selectedCategory.toString());
    selectedTags.forEach((tId) => {
      formData.append('tags', tId.toString());
      formData.append('tag_ids', tId.toString());
    });
    if (location.trim()) {
      formData.append('location', location.trim());
    }
    if (spaceId) formData.append('space_id', spaceId);
    if (imageFile) {
      formData.append('image', imageFile);
    }

    createMutation.mutate(formData, {
      onSuccess: (data) => {
        navigate(`/challenges/${data.id || data.slug}`);
      },
      onError: (err: any) => {
        const msg =
          err?.response?.data?.detail ||
          'Failed to create challenge. Please check your inputs.';
        setError(msg);
      },
    });
  };

  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="container max-w-3xl py-10 px-4 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Post a Community Challenge
        </h1>
        <p className="text-sm text-muted-foreground">
          Mobilize your neighbors and community solvers by clearly describing the problem.
        </p>
      </div>

      {/* Stepper Bar */}
      <div className="grid grid-cols-4 gap-2 border-b border-border/80 pb-6">
        {STEPS.map((step) => {
          const isDone = currentStep > step.index;
          const isCurrent = currentStep === step.index;
          const Icon = step.icon;
          return (
            <div
              key={step.index}
              className={`flex flex-col items-center text-center p-2 rounded-xl transition-colors ${
                isCurrent
                  ? 'bg-primary/10 text-primary font-bold'
                  : isDone
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground opacity-60'
              }`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full mb-1 text-xs ${
                  isCurrent
                    ? 'bg-primary text-primary-foreground font-bold'
                    : isDone
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="text-xs hidden sm:block">{step.title}</span>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3.5 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Content */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-sm">
        {/* Step 1: Title & Description */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="challenge-title">Challenge Title *</Label>
              <Input
                id="challenge-title"
                placeholder="e.g. Unsafe Pedestrian Crossing on Elm Street"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-base font-medium"
              />
              <p className="text-xs text-muted-foreground">
                Be specific and descriptive so the community can easily recognize the issue.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="challenge-desc">Detailed Description *</Label>
              <Textarea
                id="challenge-desc"
                placeholder="Describe what the problem is, how long it has persisted, who is affected, and what happens if left unresolved..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Category & Tags */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Select Category *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20 font-bold'
                          : 'border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <p className="text-xs font-semibold">{cat.name}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Related Tags (Optional)</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <Badge
                      key={tag.id}
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => toggleTag(tag.id)}
                      className="cursor-pointer text-xs py-1 px-3 transition-colors"
                    >
                      #{tag.name}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Location & Image */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="challenge-loc">Location / Neighborhood</Label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="challenge-loc"
                  placeholder="e.g. Elm St & 5th Ave, Downtown District"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="challenge-space">Community space (Optional)</Label>
              <select id="challenge-space" value={spaceId} onChange={(event) => setSpaceId(event.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm">
                <option value="">Share on CommonGround</option>
                {spaces.filter((space) => space.is_member).map((space) => <option key={space.id} value={space.id}>{space.name}{space.is_private ? ' · Private' : ''}</option>)}
              </select>
              <p className="text-xs text-muted-foreground">Challenges in private spaces are visible only to their members. Join a space before posting there.</p>
              <Link to="/spaces" className="text-xs font-semibold text-primary hover:underline">Browse or create a space</Link>
            </div>

            <div className="space-y-2">
              <Label>Challenge Photo (Recommended)</Label>
              <div className="border-2 border-dashed border-border/80 rounded-2xl p-6 text-center hover:border-primary/50 transition-colors">
                {imagePreview ? (
                  <div className="space-y-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-48 w-full object-cover rounded-xl"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                    >
                      Remove Photo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-xs text-muted-foreground">
                      Upload a photo of the issue to increase community engagement.
                    </p>
                    <label className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>Choose Image</span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <h3 className="font-bold text-lg text-foreground">Review Challenge Details</h3>

            <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
              <div>
                <span className="text-xs text-muted-foreground">Title</span>
                <p className="font-bold text-base text-foreground">{title}</p>
              </div>

              <div>
                <span className="text-xs text-muted-foreground">Category</span>
                <p className="text-xs font-semibold text-primary">
                  {activeCategoryObj?.name || 'None'}
                </p>
              </div>

              {location && (
                <div>
                  <span className="text-xs text-muted-foreground">Location</span>
                  <p className="text-xs font-medium text-foreground">{location}</p>
                </div>
              )}

              <div>
                <span className="text-xs text-muted-foreground">Description</span>
                <p className="text-xs text-muted-foreground whitespace-pre-line line-clamp-4">
                  {description}
                </p>
              </div>

              {selectedTags.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">Tags</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedTags.map((tId) => {
                      const tg = tags.find((t) => t.id === tId);
                      return tg ? (
                        <Badge key={tg.id} variant="secondary" className="text-[10px]">
                          #{tg.name}
                        </Badge>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-border/80 mt-6">
          <Button
            type="button"
            variant="ghost"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          {currentStep < 4 ? (
            <Button type="button" onClick={handleNext} className="gap-1.5">
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="cta"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="gap-2 shadow-md"
            >
              <CheckCircle className="h-4 w-4" />
              <span>{createMutation.isPending ? 'Publishing...' : 'Publish Challenge'}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
