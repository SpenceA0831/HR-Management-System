import React from 'react';
import { Chip } from '@mui/material';
import type { ChipProps } from '@mui/material';
import type { PtoStatus } from '../types';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
    status: PtoStatus;
}

const statusColorMap: Record<PtoStatus, any> = {
    'Draft': 'default',
    'Submitted': 'warning',
    'Pending': 'warning',
    'Approved': 'success',
    'Denied': 'error',
    'ChangesRequested': 'secondary',
    'Cancelled': 'default'
};

const statusLabelMap: Record<PtoStatus, string> = {
    'Draft': 'Draft',
    'Submitted': 'Awaiting Approval',
    'Pending': 'Pending',
    'Approved': 'Approved',
    'Denied': 'Denied',
    'ChangesRequested': 'Changes Requested',
    'Cancelled': 'Cancelled'
};

export const StatusChip: React.FC<StatusChipProps> = ({ status, ...props }) => {
    return (
        <Chip
            label={statusLabelMap[status]}
            color={statusColorMap[status]}
            size="small"
            sx={{
                fontWeight: 600,
                borderRadius: '6px',
                px: 0.5
            }}
            {...props}
        />
    );
};
