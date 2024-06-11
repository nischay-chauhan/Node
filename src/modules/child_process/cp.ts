import {spawn } from 'child_process'

export function example1() {
    const wc = spawn('wc', ['-l']);
    wc.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
    wc.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });
    wc.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });
}

export function example2(){
    const find = spawn('find', ['.', '-type', 'f']);
    const wc = spawn('wc', ['-l']);
    find.stdout.pipe(wc.stdin);
    wc.stdout.on('data' , (data) => {
        console.log(`Number of files : ${data}`);
    })
}

export function runCommand() {
  const command = spawn('git', ['log', '--oneline', '--graph']);
  command.stdout.on('data', (data) => {
    console.log(`Git log output: ${data}`);
  });
  command.stderr.on('data', (data) => {
    console.error(`Git log error: ${data}`);
  });
  command.on('close', (code) => {
    console.log(`Git log exited with code ${code}`);
  });
}