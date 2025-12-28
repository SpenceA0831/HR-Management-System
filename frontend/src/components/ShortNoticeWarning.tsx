import { Chip, Tooltip } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { isShortNotice } from '../utils/typeColors';

interface ShortNoticeWarningProps {
  startDate: string;
  submittedDate: string;
  thresholdDays: number;
  showLabel?: boolean;
}

export function ShortNoticeWarning({
  startDate,
  submittedDate,
  thresholdDays,
  showLabel = false,
}: ShortNoticeWarningProps) {
  if (!isShortNotice(startDate, submittedDate, thresholdDays)) {
    return null;
  }

  const start = new Date(startDate);
  const submitted = new Date(submittedDate);
  const diffTime = start.getTime() - submitted.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const tooltipText = `Short notice: Submitted ${diffDays} day${diffDays !== 1 ? 's' : ''} before start date (threshold: ${thresholdDays} days)`;

  if (showLabel) {
    return (
      <Tooltip title={tooltipText} arrow>
        <Chip
          icon={<WarningAmberIcon />}
          label="Short Notice"
          size="small"
          color="warning"
          variant="outlined"
          sx={{ fontWeight: 500 }}
        />
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltipText} arrow>
      <WarningAmberIcon
        color="warning"
        fontSize="small"
        sx={{ cursor: 'help' }}
      />
    </Tooltip>
  );
}
