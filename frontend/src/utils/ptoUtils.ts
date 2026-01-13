import {
    isWeekend,
    eachDayOfInterval,
    format,
    parseISO
} from 'date-fns';

export const calculatePtoDays = (
    startDate: Date,
    endDate: Date,
    isHalfDayStart: boolean,
    isHalfDayEnd: boolean
): number => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    let totalDays = 0;

    days.forEach((day, index) => {
        if (!isWeekend(day)) {
            let dailyValue = 1; // 1 full day

            // Check if it's the first day and half day
            if (index === 0 && isHalfDayStart) {
                dailyValue = 0.5;
            }
            // Check if it's the last day and half day
            else if (index === days.length - 1 && isHalfDayEnd) {
                dailyValue = 0.5;
            }

            totalDays += dailyValue;
        }
    });

    return totalDays;
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
