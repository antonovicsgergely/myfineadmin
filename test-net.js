const net = require('net');

const hosts = [
  "db.hnysjjguptrdidxziyovf.supabase.co",
  "aws-0-eu-central-1.pooler.supabase.com"
];
const port = 5432;

for (const host of hosts) {
  const client = new net.Socket();
  client.setTimeout(5000);

  client.connect(port, host, () => {
    console.log('Connected to ' + host + ':' + port);
    client.destroy();
  });

  client.on('error', (err) => {
    console.error('Connection error for ' + host + ':', err.message);
  });

  client.on('timeout', () => {
    console.error('Connection timed out for ' + host);
    client.destroy();
  });
}
