const fetch = require('node-fetch');
const FormData = require('form-data');

async function run(){
  const form = new FormData();
  form.append('fullname','Demo User');
  form.append('email','demo.user@example.com');
  form.append('password','DemoPass123');
  form.append('mobile','9999990000');
  form.append('city','DemoCity');
  form.append('state','DemoState');
  form.append('pincode','123456');
  form.append('role','User');

  const res = await fetch('http://localhost:5000/signup', { method: 'POST', body: form });
  const data = await res.json();
  console.log('Signup response:', data);
}

run().catch(e=>console.error(e));