
export type DateTimeString = string & { readonly __brand: unique symbol };

export const toDateTimeString = (date: Date): DateTimeString => {
    return date.toISOString() as DateTimeString;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}
