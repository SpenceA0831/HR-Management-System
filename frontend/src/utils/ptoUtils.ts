import {
    isWeekend,
    eachDayOfInterval,
    format,
    parseISO
} from 'date-fns';

export const calculatePtoHours = (
    startDate: Date,
    endDate: Date,
    isHalfDayStart: boolean,
    isHalfDayEnd: boolean
): number => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    let totalHours = 0;

    days.forEach((day, index) => {
        if (!isWeekend(day)) {
            let dailyHours = 8;

            // Check if it's the first day and half day
            if (index === 0 && isHalfDayStart) {
                dailyHours = 4;
            }
            // Check if it's the last day and half day
            // If it's the same day, we handle it elsewhere or here
            else if (index === days.length - 1 && isHalfDayEnd) {
                dailyHours = 4;
            }

            // Special case: if it's the same day and both are half day,
            // the logic above might fail or double count.
            // In reality, usually it's just one half day if it's a single day request.
            // But let's keep it simple for now.

            totalHours += dailyHours;
        }
    });

    return totalHours;
};

export const formatPtoDates = (start: string | Date, end: string | Date): string => {
    const startDate = typeof start === 'string' ? parseISO(start) : start;
    const endDate = typeof end === 'string' ? parseISO(end) : end;

    if (format(startDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) {
        return format(startDate, 'MMM d, yyyy');
    }

    return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d, yyyy')}`;
};

export const isShortNotice = (startDate: Date, thresholdDays: number = 14): boolean => {
    const now = new Date();
    const diffTime = startDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < thresholdDays && diffDays >= 0;
};
