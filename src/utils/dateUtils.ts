/**
 * Utility functions for handling Thailand Time (GMT+7)
 */

export const getThailandNow = (): Date => {
  return new Date();
};

export const formatThailandDate = (date: Date = new Date(), options: Intl.DateTimeFormatOptions = {}): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Bangkok',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...options
  };
  return new Intl.DateTimeFormat('en-GB', defaultOptions).format(date);
};

export const formatThailandDateTime = (date: Date = new Date()): string => {
  return formatThailandDate(date, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

export const getThailandTodayString = (): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
};

/**
 * Returns the components of a date in Thailand time zone
 */
export const getThailandComponents = (date: Date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0');
  
  return {
    year: getPart('year'),
    month: getPart('month') - 1, // 0-indexed for JS Date
    day: getPart('day'),
    hour: getPart('hour'),
    minute: getPart('minute'),
    second: getPart('second')
  };
};
