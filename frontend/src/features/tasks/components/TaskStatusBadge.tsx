import { Chip } from '@mui/material';

const statusConfig: Record<string, { label: string; color: 'default' | 'warning' | 'info' | 'success' }> = {
  todo: { label: 'Todo', color: 'default' },
  inprogress: { label: 'In Progress', color: 'info' },
  done: { label: 'Done', color: 'success' },
};

export default function TaskStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? { label: status, color: 'default' as const };
  return <Chip label={config.label} color={config.color} size="small" />;
}
