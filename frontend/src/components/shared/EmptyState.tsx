import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="bg-card rounded-xl p-8 border border-border text-center shadow-sm animate-fade-in">
      <div className="text-primary mb-4 flex justify-center opacity-80">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-foreground mb-2 tracking-tight">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
        {description}
      </p>
      {action && (
        <Button
          onClick={action.onClick}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm hover:shadow-lg transition-all duration-200"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
