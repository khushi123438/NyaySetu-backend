const fetch = require('node-fetch');

async function run() {
  const res = await fetch('http://localhost:5000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'advocate@example.com', password: 'password123' })
  });
  const data = await res.json();
  console.log('Login response:', data);
}

run().catch(console.error);
