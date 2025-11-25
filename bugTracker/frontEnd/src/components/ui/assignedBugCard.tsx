import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { capitalizeWords } from '@/lib/capitalizeWords';

export interface Bug {
  _id: string;
  id?: string;
  title?: string;
  description?: string;
  stepsToReproduce?: string;
  authorOfBug?: string;
  statusLabel?: string;
}

interface AssignedBugCardProps {
  bug: Bug;
  onViewDetails?: (bug: Bug) => void;
}

export function AssignedBugCard({ bug, onViewDetails }: AssignedBugCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="space-y-4 pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Bug ID:</span>
              <button
                onClick={() => onViewDetails?.(bug)}
                className="font-mono text-blue-600 hover:text-blue-800 hover:underline"
              >
                {bug._id}
              </button>
            </div>

            {bug.title && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground min-w-fit">Title:</span>
                <span className="font-medium">{bug.title}</span>
              </div>
            )}

            {bug.description && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground min-w-fit">Description:</span>
                <span className="font-medium line-clamp-2">{bug.description}</span>
              </div>
            )}

            {bug.stepsToReproduce && (
              <div className="flex items-start gap-2 text-sm">
                <span className="text-muted-foreground min-w-fit">Steps:</span>
                <span className="font-medium line-clamp-2">{bug.stepsToReproduce}</span>
              </div>
            )}

            {bug.authorOfBug && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Author:</span>
                <span className="font-medium">{bug.authorOfBug}</span>
              </div>
            )}

            {bug.statusLabel && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={bug.statusLabel === 'open' ? 'default' : 'secondary'}>
                  {capitalizeWords(bug.statusLabel)}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}