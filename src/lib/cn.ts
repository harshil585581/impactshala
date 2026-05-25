type ClassValue = string | number | boolean | null | undefined | ClassValue[];

export function cn(...inputs: ClassValue[]): string {
  return inputs
    .flat(Infinity as 20)
    .filter(Boolean)
    .join(' ');
}
