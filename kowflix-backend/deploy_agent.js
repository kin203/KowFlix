const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const CONFIG = {
    host: 'nk203home.myddns.me',
    port: 2222,
    username: 'root',
    // We assume the user has key-based auth working as per their terminal output
    privateKey: fs.readFileSync(path.join(process.env.USERPROFILE || process.env.HOME, '.ssh', 'id_rsa')),
    remoteDir: '/home/kowflix/agent',
    localDir: path.join(__dirname, 'storage-scripts')
};

console.log('🚀 Starting Deployment to ' + CONFIG.host + '...');

const conn = new Client();

conn.on('ready', () => {
    console.log('✅ SSH Connection Established');

    // 1. Create Remote Directory
    conn.exec(`mkdir -p ${CONFIG.remoteDir}`, (err, stream) => {
        if (err) throw err;

        stream.on('close', (code, signal) => {
            console.log('📂 Remote directory ensured: ' + CONFIG.remoteDir);
            uploadFiles();
        }).on('data', (data) => {
            console.log('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
            console.log('STDERR: ' + data);
        });
    });

}).on('error', (err) => {
    console.error('❌ SSH Connection Error:', err);
}).connect(CONFIG);

function uploadFiles() {
    console.log('📤 Uploading files via SCP...');

    // We use system SCP because implementing recursive upload with strictly ssh2 is complex
    // SCP command structure: scp -P 2222 -r local/path root@host:remote/path

    const cmd = `scp -P ${CONFIG.port} -r "${CONFIG.localDir}\\*" ${CONFIG.username}@${CONFIG.host}:${CONFIG.remoteDir}`;

    exec(cmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ SCP Error: ${error.message}`);
            conn.end();
            return;
        }
        if (stderr) console.log(`SCP Stderr: ${stderr}`);
        console.log('✅ Files Uploaded Successfully');

        installAndStart();
    });
}

function installAndStart() {
    console.log('⚙️  Installing dependencies and starting Agent...');

    const startCmd = `
        cd ${CONFIG.remoteDir} && 
        npm install && 
        pm2 delete kowflix-storage-agent || true && 
        pm2 start agent.js --name "kowflix-storage-agent"
    `;

    conn.exec(startCmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code, signal) => {
            console.log('✅ Agent deployed and started!');
            console.log('👉 Please ensure valid port forwarding for 3001 if using Direct Upload.');
            conn.end();
        }).on('data', (data) => {
            console.log('REMOTE: ' + data);
        }).stderr.on('data', (data) => {
            console.log('REMOTE ERR: ' + data);
        });
    });
}
