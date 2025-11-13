const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const FormData = require('form-data');

async function run() {
  const form = new FormData();
  form.append('fullname', 'Test Advocate');
  form.append('email', 'advocate@example.com');
  form.append('password', 'password123');
  form.append('mobile', '9999999999');
  form.append('city', 'TestCity');
  form.append('state', 'TestState');
  form.append('pincode', '123456');
  form.append('role', 'Advocate');
  form.append('barid', 'UP/1234/2021');
  form.append('experience', '5');
  // add specializations as comma-separated string (backend expects single string)
  form.append('specialization', 'criminal,family');

  // attach a small placeholder file (create one if needed)
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
  const imgPath = path.join(uploadsDir, 'test-photo.txt');
  fs.writeFileSync(imgPath, 'fake image content');
  form.append('photo', fs.createReadStream(imgPath));

  const res = await fetch('http://localhost:5000/signup', {
    method: 'POST',
    body: form
  });
  const data = await res.json();
  console.log('Signup response:', data);

  const adv = await (await fetch('http://localhost:5000/advocates')).json();
  console.log('/advocates:', adv);
}

run().catch(err => console.error(err));
