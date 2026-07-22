import mongoose from 'mongoose';
import fs from 'fs';
import jwt from 'jsonwebtoken';
const uri = fs.readFileSync('/tmp/uri.txt', 'utf8').trim();
await mongoose.connect(uri);
const User = mongoose.model('User', new mongoose.Schema({}, {strict:false}), 'users');
const admin = await User.findOne({ role: 'super-admin' });
const secret = '3a7f5d9e1c8b2a4f6d9e3c5a7f1e8d2b4a6c9e3f5a7d1b8e2c4a6f9d3e5b7a1c8e3f6d9b2a4c7e5f1a8d3b6';
const token = jwt.sign({ email: admin.email, role: admin.role, number: admin.number }, secret, { expiresIn: '1h' });
const id = '6a512a5b2e58a584c4271261';

// Step 1: confirm DB now has DIRECT-MONGO-CLASSIC
const Raw = mongoose.model('RawP5', new mongoose.Schema({}, {strict:false,collection:'products'}), 'products');
const before = await Raw.findById(id).lean();
console.log('BEFORE API PATCH — DB theme:', before?.landingPage?.theme, 'heroBadge:', before?.landingPage?.heroBadge);

// Step 2: API PATCH
const patchRes = await fetch('http://localhost:3000/api/v1/product/status/'+id, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', Cookie: 'accessToken='+token },
  body: JSON.stringify({ landingPage: { theme: 'health', heroBadge: 'API-NEW-BADGE' } }),
});
const j = await patchRes.json();
console.log('PATCH status:', patchRes.status, 'msg:', j.message);
console.log('PATCH response theme:', j.data?.landingPage?.theme);
console.log('PATCH response heroBadge:', j.data?.landingPage?.heroBadge);

// Step 3: re-read raw
const after = await Raw.findById(id).lean();
console.log('AFTER API PATCH — DB theme:', after?.landingPage?.theme, 'heroBadge:', after?.landingPage?.heroBadge);
await mongoose.disconnect();