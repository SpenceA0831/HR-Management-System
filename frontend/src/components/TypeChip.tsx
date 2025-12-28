import { Chip, type ChipProps } from '@mui/material';
import type { PtoType } from '../types';
import { getTypeColor } from '../utils/typeColors';

interface TypeChipProps {
  type: PtoType;
  size?: ChipProps['size'];
  variant?: ChipProps['variant'];
}

export function TypeChip({ type, size = 'small', variant = 'filled' }: TypeChipProps) {
  const colors = getTypeColor(type);

  return (
    <Chip
      label={type}
      size={size}
      variant={variant}
      sx={{
        backgroundColor: variant === 'filled' ? colors.main : 'transparent',
        color: variant === 'filled' ? '#fff' : colors.main,
        borderColor: colors.main,
        fontWeight: 500,
        '&:hover': {
          backgroundColor: variant === 'filled' ? colors.dark : colors.light,
        },
      }}
    />
  );
}
