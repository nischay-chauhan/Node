import { streamReadFile, streamWriteFile } from './modules/fs/streamFs';

const filePath = 'test.txt';
const data = 'This is a sample content for streaming write operation.';

// Stream write to file
streamWriteFile(filePath, data);

// Stream read from file
streamReadFile(filePath);
