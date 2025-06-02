export const enumsToArray = (enums: { [key: string]: string | number }): number[] => {
  return Object.values(enums).filter((item) => typeof item === 'number') as number[];
};
