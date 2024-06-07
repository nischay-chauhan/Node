import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

export const streamReadFile = (filePath: string): void => {
    const absolutePath = path.resolve(filePath);
    const readStream = fs.createReadStream(absolutePath, { encoding: 'utf-8' });
    const rl = readline.createInterface({
        input: readStream,
        output: process.stdout,
        terminal: false
    });

    rl.on('line', (line) => {
        const words = line.split(/\s+/);
        words.forEach(word => {
            console.log('Read word:', word);
        });
    });

    rl.on('close', () => {
        console.log('Finished reading file.');
    });

    rl.on('error', (error) => {
        console.error('Error reading file:', error);
    });
};

export const streamWriteFile = (filePath: string, data: string): void => {
    const absolutePath = path.resolve(filePath);
    const writeStream = fs.createWriteStream(absolutePath);

    writeStream.write(data);
    writeStream.end();

    writeStream.on('finish', () => {
        console.log('Finished writing to file.');
        streamReadFile(filePath);
    });

    writeStream.on('error', (error) => {
        console.error('Error writing to file:', error);
    });
};
