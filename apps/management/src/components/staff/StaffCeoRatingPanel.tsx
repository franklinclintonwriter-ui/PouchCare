import { useState } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { useRateStaff } from '@/api/staff';

export function StaffCeoRatingPanel({
  memberId,
  lastRating,
  lastNote,
  lastRatedDate,
}: {
  memberId: string;
  lastRating: number | null | undefined;
  lastNote: string | null | undefined;
  lastRatedDate: string | null | undefined;
}) {
  const rate = useRateStaff();
  const [rating, setRating] = useState('');
  const [note, setNote] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = Number(rating);
    if (!Number.isFinite(n) || n < 1 || n > 10) {
      toast.error('Enter a rating between 1 and 10');
      return;
    }
    try {
      await rate.mutateAsync({ id: memberId, rating: n, note: note.trim() || undefined });
      toast.success('Performance rating saved');
      setRating('');
      setNote('');
    } catch {
      toast.error('Could not save rating');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Star className="h-4 w-4 text-amber-500" />
          CEO performance rating
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          1–10 scale. Visible on this profile and included in leadership reporting.
        </p>
      </CardHeader>
      <CardContent>
        {(lastRating != null || lastRatedDate) && (
          <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800/50">
            <p>
              <span className="text-gray-500 dark:text-gray-400">Last rating:</span>{' '}
              <span className="font-medium tabular-nums">{lastRating ?? '—'}</span>
              {lastRatedDate ? (
                <span className="text-gray-500 dark:text-gray-400">
                  {' '}
                  · {new Date(lastRatedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              ) : null}
            </p>
            {lastNote ? <p className="mt-1 text-gray-600 dark:text-gray-300">{lastNote}</p> : null}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Rating (1–10)"
            type="number"
            min={1}
            max={10}
            step={1}
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            placeholder="e.g. 8"
          />
          <Textarea
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Context for this rating…"
          />
          <Button type="submit" disabled={rate.isPending}>
            {rate.isPending ? 'Saving…' : 'Save rating'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
