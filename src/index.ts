import { streamReadFile, streamWriteFile } from './modules/fs/streamFs';
import * as readline from 'readline';
import * as cp from "./modules/child_process/cp";
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const filePath = 'example.txt';

rl.question('Enter the content to write to the file: ', (input) => {
    streamWriteFile(filePath, input);
    rl.close();
});

rl.on('close', () => {
    console.log('Reading file content...');
    streamReadFile(filePath);
});

cp.runCommand();