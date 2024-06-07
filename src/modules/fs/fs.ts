// modules/fs/fs.ts
import * as fs from 'fs';

export const readFileContent = (path: string): string => {
    try {
        return fs.readFileSync(path, 'utf-8');
    } catch (error) {
        throw error;
    }
};
