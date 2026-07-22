const mongoose = require('mongoose');
const fs = require('fs');
(async () => {
  const uri = fs.readFileSync('/tmp/uri.txt', 'utf8').trim();
  await mongoose.connect(uri);
  const id = '6a512a5b2e58a584c4271261';
  const before = await mongoose.connection.db.collection('products').findOne({ _id: new mongoose.Types.ObjectId(id) }, { projection: { landingPage: 1 } });
  console.log('BEFORE theme:', before?.landingPage?.theme);
  const upd = await mongoose.connection.db.collection('products').findOneAndUpdate(
    { _id: new mongoose.Types.ObjectId(id) },
    { $set: { landingPage: {
        theme: 'bold',
        heroTitle: 'PROBE title',
        heroSubtitle: 'PROBE sub',
        heroBadge: 'PROBE badge',
        heroCtaLabel: 'PROBE cta',
        painPoints: ['p1','p2'],
        benefits: ['b1'],
        howToUse: [],
        guarantee: 'PROBE guarantee',
        trustBadges: ['t1'],
        vslUrl: '',
        youtubeUrl: '',
        checkoutNote: 'PROBE checkout',
        comparison: { oursTitle: 'PROBE ours', oursItems: ['oi'], othersTitle: 'PROBE others', othersItems: ['oo'] },
        phoneStripNote: 'PROBE phone'
    } } },
    { returnDocument: 'after' }
  );
  console.log('AFTER theme:', upd?.landingPage?.theme, '| heroTitle:', upd?.landingPage?.heroTitle);
  console.log('AFTER heroSubtitle:', upd?.landingPage?.heroSubtitle, '| heroBadge:', upd?.landingPage?.heroBadge);
  console.log('AFTER painPoints:', JSON.stringify(upd?.landingPage?.painPoints));
  console.log('AFTER comparison.oursItems:', JSON.stringify(upd?.landingPage?.comparison?.oursItems));
  // restore
  await mongoose.connection.db.collection('products').updateOne({ _id: new mongoose.Types.ObjectId(id) }, { $set: { landingPage: before?.landingPage } });
  console.log('RESTORED to theme=', before?.landingPage?.theme);
  await mongoose.disconnect();
})().catch(e => { console.error(e); process.exit(1); });
