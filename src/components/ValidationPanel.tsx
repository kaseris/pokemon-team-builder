import type { ValidationIssue } from '../types/format';

type Props = {
  issues: ValidationIssue[];
};

const SEVERITY_STYLES = {
  error: 'border-danger/40 bg-danger/10 text-danger',
  warning: 'border-warning/40 bg-warning/10 text-warning',
  info: 'border-border bg-surface-overlay text-muted',
};

export function ValidationPanel({ issues }: Props) {
  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="section-title">Validation</h2>
        <div className="flex gap-2 text-xs">
          {errors.length > 0 && (
            <span className="rounded-full bg-danger/20 px-2 py-0.5 text-danger">
              {errors.length} error{errors.length !== 1 ? 's' : ''}
            </span>
          )}
          {warnings.length > 0 && (
            <span className="rounded-full bg-warning/20 px-2 py-0.5 text-warning">
              {warnings.length} warning{warnings.length !== 1 ? 's' : ''}
            </span>
          )}
          {issues.length === 0 && (
            <span className="rounded-full bg-success/20 px-2 py-0.5 text-success">Legal</span>
          )}
        </div>
      </div>
      {issues.length === 0 ? (
        <p className="text-sm text-success">Team passes all validation checks.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {issues.map((issue, i) => (
            <li
              key={`${issue.code}-${i}`}
              className={`rounded-lg border px-3 py-2 text-sm ${SEVERITY_STYLES[issue.severity]}`}
            >
              {issue.pokemonIndex !== undefined && (
                <span className="mr-1 font-medium">Slot {issue.pokemonIndex + 1}:</span>
              )}
              {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
