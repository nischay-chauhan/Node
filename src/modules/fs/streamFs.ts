import * as fs from 'fs';
import * as path from 'path';

export const streamReadFile = (filePath: string): void => {
    const absolutePath = path.resolve(filePath);
    const readStream = fs.createReadStream(absolutePath, { encoding: 'utf-8' });

    readStream.on('data', (chunk) => {
        console.log('Received chunk:', chunk);
    });

    readStream.on('end', () => {
        console.log('Finished reading file.');
    });

    readStream.on('error', (error) => {
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
    });

    writeStream.on('error', (error) => {
        console.error('Error writing to file:', error);
    });
};
