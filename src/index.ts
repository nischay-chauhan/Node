// src/index.ts
import * as fs from 'fs';

fs.writeFile('test.txt', 'Hello, world!', (err: NodeJS.ErrnoException | null) => {
    if (err) {
        console.error('Error writing file:', err);
        return;
    }
    console.log('File written successfully');
});
