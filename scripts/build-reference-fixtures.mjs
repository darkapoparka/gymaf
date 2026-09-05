import fs from 'node:fs';
const read = path => JSON.parse(fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
const recipes = read('docs/screen-state-recipes.json');
// Explicit route corrections. OCR keyword matching confused parent pages with links contained in them.
const groups = [
 ['/?activity=completed', '0890079a95f41f87 f47162e51bcdadad 944167db1d6d1f4b', 'Completed home; weekly summary and account notices'],
 ['/settings/workout', '8ce2314bc1422fc8 1cb5bd47a8dd1541 260da8717befc18a 60985223ac9f138b 832851a4a7925a42', 'Workout settings; scroll to the captured audio, heart-rate or watch section'],
 ['/settings/instructions', 'a65a68b05a4f7bcf e9cf6691b1825416', 'Exercise instruction selection'],
 ['/settings/heart-rate', 'd89797aec72d9761 b50f7a7db1dd2106 46268c727e736b1c', 'Maximum heart-rate form; keyboard is provided by the browser/device'],
 ['/workouts/morning-yoga/session?activity=reps', '8df73e3cd33561bb 441dad8115c25dc0', 'Modified Plyo Push-Up repetition adjustment'],
 ['/workouts/morning-yoga/summary?activity=share', 'ef9c7875de7a5182', 'Share workout sheet'],
 ['/workouts/morning-yoga/summary?activity=feedback', '3a92d2d5321e1e2b 30911205601a5847 c74f945c3522715d 4164718dff7491cc 17f00755a1f2445d', 'Workout feedback with captured comment and flagged exercise state'],
 ['/schedule', 'f845af9cab2c56dc aea6304de981a862 532d0f40834de913 948a38b6eea32d7a dfbcc5d54315239b 60435d9b0d00713c', 'Schedule and reason-for-change states'],
 ['/progress', '9446df791c2cf84b ae6f6828a96ef127 26397d459a360eab a67702fc83ea3d05 cac5c501bc6a10ec 54d2648586600727 f8dc49d0fe545540 83aa026b2c7d5972 372ec72a4ad42b9a', 'Progress Goals or Metrics tab; scroll to the captured section'],
 ['/progress/consistency', '7b01261aafcd5709 da024204f479856f', 'Workout consistency calendar'],
 ['/progress/metrics', '1d3699ebfaeb1264 69c1552bd207febb 184fb1cc4be177d5 d896283a02dd3322', 'Editable metrics list and captured order'],
 ['/progress/photos', '8442edc56bd7a6a2 b9ebd53fefdbd7b8', 'Progress photo timeline; source photos are review fixtures'],
 ['/progress/photos/add', '0c9d6d9336ed2060 cee9a987b896f939 14a78fdd2e2f981c 9f32c528eb3122b5', 'Front, back and side photo entry; native camera controls are device supplied'],
 ['/progress/weight', 'd0bffd680203472f e95ed2394c15c550 a0b73ff31607572f', 'Weight overview with captured target and measurement state'],
 ['/progress/target', '92f7fea0a4f23770 bfea6e37fa7d9b94', 'Target weight entry'],
 ['/progress/log-weight', '654b8d1920644b89 88f6f0ef24add973', 'Weight measurement entry'],
 ['/messages', 'e9f1d9e135143206', 'Historical conversation with heart-rate, workout and challenge events'],
 ['/friends/invite', '230ba48bd84b5618 37e236af15c00e2a', 'Guest-pass credits and QR sharing sheet'],
 ['/profile/event', '52738508d08de10f ec59526f80f48f32 0a8b40e28e7bd6f2', 'Event form with captured title, details and dates'],
 ['/profile/edit', '587607868798e2bf 11cdf70d01f98f9d 7341749f58fd2736 2d63b2d421e8986c', 'Profile editing, interests and privacy'],
 ['/profile/cover', 'f0f400f1407a9492 cf555b20934717e7', 'Cover photo crop; source photograph fixture'],
 ['/settings', 'a024a61347fa078a 0321f6f626e81a5f bca9653d973f5702', 'Settings overview; scroll to locations or injury and app settings'],
 ['/account/membership', 'd82e5dc3852242e7 4f3ba8d8c82561b3 a2b8db895a5f8c16 fa33f93ee04cad49', 'Membership and billing overview'],
 ['/account/plan', '6699b1f8a7f819b9', 'Membership plan selection'],
 ['/account/cancel/confirm', '15ddb207c83425d2', 'Cancellation confirmation'],
 ['/account/cancel/done', '61715db212cf2a1b', 'Pending cancellation result'],
 ['/account/shipping', '35d81d4c979a3195 c69fee952cd49b41 716fd33fa6bc37d2 693755a9410f5831', 'Shipping form; native select menu is browser supplied'],
 ['/settings/equipment', '464d28d1e615a0cc 6f7906549b48f376 3c3f5b2ae12f0a16 80efc3cf90fd540c', 'Hotel gym equipment selections and setup tab'],
 ['/settings/app', '22d870084ca0661b 9b057830c0013b72', 'App preferences; scroll to camera roll section'],
 ['/system/launch', '537d86727616b47e', 'Launch transition with Future emblem; click to continue'],
 ['/coaches/matt', 'cdd7b72066569858', 'Alternative coach Matt, past experience and selection'],
 ['/messages', '06b4af20ce799415', '500-calorie achievement dialog over the conversation'],
];
for (const [route, ids, text] of groups) for (const id of ids.split(' ')) recipes[id] = [route, text];
fs.writeFileSync('docs/screen-state-recipes.json', JSON.stringify(recipes, null, 2));
// This generator only authors fixture data. Rendering remains real React components and controls.
const sources = read('docs/reference-screens.json');
const fixtures = Object.fromEntries(sources.map(s => [s.id, { id: s.id, data: { preferences: {}, interest: '', events: [], messages: [], favorites: [], completed: [], sessions: {}, feedback: {} }, ui: {} }]));
function ui(ids, values) { for (const id of ids.split(' ')) Object.assign(fixtures[id].ui, values); }
function data(ids, values) { for (const id of ids.split(' ')) Object.assign(fixtures[id].data, values); }
function prefs(ids, values) { for (const id of ids.split(' ')) Object.assign(fixtures[id].data.preferences, values); }
// Source status bars are comparison chrome, separate from ordinary browser UI.
for (const [id, values] of Object.entries(read('docs/reference-chrome.json'))) ui(id, values);
// Distinct native media states retained by the source capture.
ui('03c8df3d92da317a', { 'record.state': 'ready' });
ui('452442b79e2166cf', { 'record.state': 'recording', 'record.seconds': 4 });
ui('628aa2e63266eb7e', { 'record.state': 'preview' });
ui('7887b9889658f2a9', { 'record.state': 'send' });
ui('cee9a987b896f939', { 'photos.source': true });
ui('098311074fbc0d30', { 'photos.camera': true, 'photos.timer': 5 });
ui('dac1a3cf0fffb20a', { 'photos.camera': true, 'photos.timer': 5, 'photos.countdown': 4 });
const blackFrame="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cpath fill='black' d='M0 0h300v300H0z'/%3E%3C/svg%3E";
ui('9f32c528eb3122b5', { 'photos.draft': { 'Full Body - Front': blackFrame } });
ui('14a78fdd2e2f981c', { 'photos.draft': Object.fromEntries(['Front','Back','Side'].map(k=>['Full Body - '+k,blackFrame])) });
data('b9ebd53fefdbd7b8', { photos: ['Front','Back','Side'].map(k=>({ id:'source-'+k, kind:'Full Body - '+k, date:'2026-07-01', src:blackFrame })) });
ui('f0f400f1407a9492', { 'cover.loaded': false });
ui('cf555b20934717e7', { 'cover.loaded': true, 'cover.selection': 'ocean' });
ui('f9ddae79f8fdb799', { unreadMessages: 1 });
// Auth and coach matching.
ui('60e50acd6ca18e02 e189ade08bb8e1eb', { 'onboarding.contact': 'alexsmith.mobbin+1@gmail.com' });
prefs('04544bc90c7072a5', { coachQualities: JSON.stringify(['Always positive', 'Has a sense of humor']) });
prefs('40136879a4cf68ac', { coachIntensity: '2' }); prefs('e926bc36ba650bd8', { coachIntensity: '1' });
ui('c143403931126a67', { 'onboarding.coachPage': 3 });
ui('9bbfbb4408c5aa98 1ee01f448b7491b4 ffc4e49a11c1acaf', { 'onboarding.sheet': 'Expertise' });
prefs('1ee01f448b7491b4 32e4b5a461cdee6c', { coachExpertise: '["Weight Loss"]' });
ui('ffc4e49a11c1acaf', { 'onboarding.sort': 'A–Z' });
prefs('6786891202a185f3', { appointmentDay: 'Mon 29', appointmentTime: '' });
prefs('153228f229e7dca2', { appointmentDay: 'Thu 2', appointmentTime: '12:00 AM' });
ui('153228f229e7dca2', { 'booking.times': ['12:00 AM', '12:15 AM', '12:30 AM', '12:45 AM', '1:00 AM', '1:15 AM', '1:30 AM', '1:45 AM'] });
prefs('88bcda17089826ed', { activities: JSON.stringify(['CrossFit', 'Strength Training', 'Personal Training', 'HIIT', 'Swimming']) });
ui('42bb4a3de314cb9f', { 'onboarding.query': 'Swimming' }); prefs('42bb4a3de314cb9f', { activities: '["Swimming"]' });
prefs('554f8ad3d30873c4', { hasInjury: 'No' }); prefs('6678002287f3602b', { hasInjury: 'Yes' });
ui('f9f9cbadb23780d7 133c603f4469b7a4 2753cde1987791db', { 'onboarding.sheet': 'Add Gym' });
prefs('133c603f4469b7a4 2753cde1987791db', { gymName: 'Equinox', gymType: 'Commercial Gym' });
data('effd0d3e27cbba21', { favorites: ['morning-yoga'] });
// Exercise state can be entered directly, then changed using normal controls.
ui('db68d717b839be9c', { 'session.step': 4, 'session.elapsed': 141 });
ui('b399d75f2cab7473', { 'session.expanded': false });
ui('8df73e3cd33561bb 441dad8115c25dc0 79ebf52716335b59', { 'session.replaced': true, 'session.step': 4, 'session.elapsed': 186, 'session.reps': '15' });
ui('05a17c38ff39fccf d9903c7d95a8ba76', { 'session.reasons': ['Uncomfortable'] });
ui('d9903c7d95a8ba76', { 'session.comment': 'Feels cramp on my calf' });
ui('d37166677b0b6079 bef09692612c79a9', { 'session.replaced': true });
ui('bef09692612c79a9', { 'session.sheet': null });
ui('9492113d9710273c', { 'session.historyRange': '30 Days' });
ui('c3aecc2fdeda0fef', { 'summary.template': 1 });
const feedback = "I'm trying yoga bcs I wanna know how it feels. Never done it before. I think my form is not quite right, bcs my flexibility is not that good";
const feedbackIds = '30911205601a5847 c74f945c3522715d 4164718dff7491cc 17f00755a1f2445d';
data(feedbackIds, { feedback: { 'morning-yoga': { rating: 4, text: feedback } } });
prefs('7eb55b06aab6cb7a 3a92d2d5321e1e2b '+feedbackIds, { 'flag:morning-yoga': JSON.stringify({ exercise: 'Modified Plyo Push-Up', reasons: ['Uncomfortable'], comment: 'Feels cramp on my calf' }) });
ui('3a92d2d5321e1e2b', { 'summary.tough': '1' });
ui('6a45a461602f837d', { 'summary.editFlag': true });
ui('1769149f55abb90d', { 'summary.notice': "Strong Start Challenge — You've knocked out 1 of 12 workouts!" });
ui('85e00e517076b820', { 'summary.notice': 'Link Copied' });
ui('a28e9eedc0c7a471', { 'workouts.filter': 'Duration' });
ui('9f49c1dd63bf829c 22f2af83452b8d62', { 'workouts.duration': 'Quick' });
ui('22f2af83452b8d62', { 'workouts.equipment': 'No Equipment' });
ui('7e1fbea48e31336c', { 'workouts.tab': 'Just Work Out', 'workouts.search': '', 'workouts.searchOpen': true });
ui('854ff6c1480f1c23', { 'workouts.tab': 'Just Work Out', 'workouts.search': '' });
ui('427a9bc6ccab8e60', { 'workouts.tab': 'Just Work Out', 'workouts.search': 'Hike', 'workouts.searchOpen': true });
ui('479f5f6fe605d407', { 'schedule.sheet': 'Just Work Out' });
ui('50bfcead6704f5ea 8cfdb06d509ad322 c1aafce51bd4fb31', { 'schedule.sheet': 'Just Work Out', 'schedule.selection': 'running', 'schedule.duration': '45' });
data('aea6304de981a862 532d0f40834de913 948a38b6eea32d7a 944167db1d6d1f4b', { schedule: { Tuesday: 'morning-yoga', Wednesday: 'running' } });
data('dfbcc5d54315239b', { schedule: { Tuesday: 'morning-yoga', Wednesday: 'running', Thursday: 'running' } });
data('60435d9b0d00713c', { schedule: { Tuesday: 'morning-yoga', Wednesday: 'running' } });
ui('532d0f40834de913 948a38b6eea32d7a', { 'schedule.sheet': 'Reason for schedule change' });
ui('948a38b6eea32d7a', { 'schedule.reason': "I'm planning to run later" });
// Goals, metrics and measurements.
data('9446df791c2cf84b', { goal: 'Increase Muscle Mass' });
data('f8dc49d0fe545540', { goal: 'Improve Health and Longevity' });
ui('a67702fc83ea3d05 cac5c501bc6a10ec 54d2648586600727 83aa026b2c7d5972 372ec72a4ad42b9a c3fd263f671179fa', { 'progress.tab': 'Metrics' });
ui('a671de3ec25ed4d5 cc91972a8b91c317', { 'progress.goalOpen': true });
ui('cc91972a8b91c317', { 'progress.goal': 'Improve Health and Longevity' });
prefs('184fb1cc4be177d5 83aa026b2c7d5972', { metrics: '["Minutes of Activity","Activity Rings","Daily Steps"]' });
prefs('d896283a02dd3322 372ec72a4ad42b9a', { metrics: '["Activity Rings","Minutes of Activity","Daily Steps","Average Pace","Progress Photos","Weight"]' });
prefs('bfea6e37fa7d9b94 e95ed2394c15c550 a0b73ff31607572f', { targetWeight: '161' });
prefs('88f6f0ef24add973', { weightEntry: '156' });
data('a0b73ff31607572f', { weight: '156', weightHistory: [{ id: 'source-weight', value: '156', date: '2026-07-03' }] });
ui('37e236af15c00e2a', { 'progressFlow.sheet': 'Send Guest Pass' });
ui('52738508d08de10f ec59526f80f48f32 0a8b40e28e7bd6f2', { 'progressFlow.date': '2026-07-26', 'progressFlow.tab': 'Event' });
prefs('ec59526f80f48f32 0a8b40e28e7bd6f2', { eventName: '5K Jakarta Open Trail Run', eventDetails: 'Elevation gain: 284 M', eventStart: '2026-07-26', eventEnd: '2026-07-26', eventVisibility: 'true' });
data('11cdf70d01f98f9d 2d63b2d421e8986c', { interest: 'running' }); data('2d63b2d421e8986c', { privateProfile: true });
prefs('a2b8db895a5f8c16', { membershipStatus: 'Pending Cancellation' });
prefs('c69fee952cd49b41 716fd33fa6bc37d2 693755a9410f5831', { shippingStreet: '1226 University Dr', shippingCity: 'Menlo Park', shippingState: 'CA', shippingZip: '94025' });
prefs('693755a9410f5831', { shirtSize: 'M' });
data('464d28d1e615a0cc 6f7906549b48f376', { locations: [{ id: 'hotel', name: 'Hotel gym', kind: 'Hotel Gym', equipment: [] }] });
data('3c3f5b2ae12f0a16 80efc3cf90fd540c', { locations: [{ id: 'hotel', name: 'Hotel gym', kind: 'Hotel Gym', equipment: ['Elliptical', 'Dumbbell', 'Wall', 'Yoga Mat'] }] });
ui('80efc3cf90fd540c', { 'account.tab': 'Your Setup' });
prefs('b50f7a7db1dd2106 46268c727e736b1c', { heartRateMax: '190' });
prefs('e9cf6691b1825416 260da8717befc18a', { exerciseInstructions: 'Never' });
prefs('448d55aa6af7c20d 60985223ac9f138b', { workoutTone: 'Beep' });
// Source conversations are selectable snapshots, not fabricated live communications.
for (const [id, history] of Object.entries({ '5cd2903b6dc7cc19': 'setup', 'e9f1d9e135143206': 'yoga', '3707b8d0f4c3b815': 'events', '8fb5d0b81c309b95': 'workout', '244a2df35948b3dd': 'away' })) ui(id, { 'community.history': history });
ui('96860a7f9c42a793', { 'community.text': 'Hi sorry! Actually I think we can discuss via chat instead?' });
data('8c16d1cc0eb9ae1f', { messages: [{ id: 'source-message', text: 'Hi sorry! Actually I think we can discuss via chat instead?' }] });
ui('06b4af20ce799415', { 'community.achievement': true });
ui('e690c12004fa0b11 5b8853eb6bed9cfa', { 'account.sheet': 'Explore' });
prefs('5b8853eb6bed9cfa', { coachChangeReasons: 'Ready for something new|Different coach personality' });
ui('8724ed8b412f949b', { 'account.sheet': 'Sign Out' });
ui('a87f5f2814c17f7c', { 'account.saving': true });
ui('45ff34930241ec24 f4dd4750b643f25c', { 'account.sheet': 'Select Dumbbells' });
prefs('f4dd4750b643f25c', { 'dumbbell-2.3': 'true', 'dumbbell-4.5': 'true' });
ui('b9f1086598b7e89b', { 'system.expanded': true });
ui('32f0fc08b604cc93', { 'progressFlow.tab': 'Travel', 'progressFlow.date': '2026-07-01' });
ui('0613c59580d3a48f', { 'progressFlow.sheet': 'Thursday’s Workout' });
ui('a8fa9ad2ffa8ecd9', { 'progressFlow.sheet': 'Did you finish your workout?' });
ui('cee9a987b896f939', { 'progressFlow.sheet': 'Add Photo' });
prefs('88f6f0ef24add973', { loggedWeight: '156', weightDate: '2026-07-03' });
prefs('c60d76b4556ccf29', { locationName: 'Hotel gym' });
prefs('133c603f4469b7a4 2753cde1987791db', { locationName: 'Equinox', locationType: 'Commercial Gym' });
prefs('51c3ec60abd95c16', { workoutDuration: '60' });
prefs('b2cf720138e8e91c', { appointmentBooked: 'true', appointmentDay: 'Thu 2', appointmentTime: '12:00 AM' });
prefs('8ac22ec411e8c405', { contact: 'alexsmith.mobbin@gmail.com' });
prefs('7d8dea8cbab0f554 fb935a0aeee796e9 8724ed8b412f949b', { phone: '+1 (650) 213-7552' });
prefs('85169600dcd16f7c', { preferredName: '' });
prefs('1ae56351357fac91', { preferredName: 'Alex' });
const injury = "Back in third week of June, I hiked and fall. My right ankle still doesn't feel right. I alr go to doctor and nothing fractured";
prefs('b25431078c7923a8 68564002a352ea0b bff6c138c772d2c2', { injuryDescription: injury, injuryMovement: 'Yes' });
data('6c630c7f068150c8 bca9653d973f5702 4917c735489f6b4c 8a7901a5c21e862f', { injuries: [{ id: 'source-injury', description: injury, affectsMovement: true, excluded: ['Med Ball Scoop Toss','Stability Ball Pike','Tripod Headstand','Kettlebell Clean to Push Press','Sandbag Push Press','Dumbbell Hang Clean to Push Press','Headstand'] }] });
data('19cb4b2390d35bd5 4a19ac431481a9af 9900515c67c3bc0b', { interest: 'running', events: [{ id: 'source-event', name: '5K Jakarta Open Trail Run', date: '2026-07-26' }] });
prefs('e9ff9ded70b5f433 93e000d6f001413c 9900515c67c3bc0b', { profileWorkouts: '0', memberSince: 'Jul 2026' });
data('93e000d6f001413c', { interest: 'running' });
// Initial scrolled regions are part of reference state. Controls remain available above and below.
ui('4050314ce4aaa198', { scrollY: 470 }); ui('8ee44ade589ce9ac', { scrollY: 820 });
ui('0321f6f626e81a5f bca9653d973f5702', { scrollY: 260 });
ui('1cb5bd47a8dd1541', { scrollY: 565 });
ui('9b057830c0013b72', { scrollY: 185 });
ui('4a19ac431481a9af', { scrollY: 300 });
ui('26397d459a360eab', { scrollY: 190 });
ui('54d2648586600727 372ec72a4ad42b9a c3fd263f671179fa', { scrollY: 480 });
ui('6f7906549b48f376 3c3f5b2ae12f0a16', { scrollY: 370 });
ui('cc7503a7402e36c1', { scrollY: 420 });
ui('d7e03432f62fa9cf fb935a0aeee796e9', { scrollY: 300 });
ui('7d8dea8cbab0f554', { scrollY: 510 });
ui('c8af58d62a9ed8f7', { scrollY: 160 });
// Focus and native keyboard are part of the captured viewport, not browser-wide UI.
function keyboard(ids,type,selector,extra={}) { ui(ids,{keyboard:{type,selector,...extra}}); }
keyboard('5043e58748db681f','phone','input[aria-label="Phone Number"]',{dark:true});
keyboard('5a2d4d735d5445f9 60e50acd6ca18e02','email','input[aria-label="Email"]',{dark:true});
keyboard('83b5292282d583e4','text','input[placeholder="Search or Add Activity"]');
keyboard('f9f9cbadb23780d7 133c603f4469b7a4','text','input[name="locationName"]');
keyboard('b50f7a7db1dd2106','number','input[name="heartRateMax"]',{done:true});
keyboard('8df73e3cd33561bb 441dad8115c25dc0','number','dialog input[type="number"]');
keyboard('532d0f40834de913 948a38b6eea32d7a','text','dialog textarea');
keyboard('92f7fea0a4f23770 bfea6e37fa7d9b94','number','input[aria-label="Target Weight"]',{done:true});
keyboard('654b8d1920644b89 88f6f0ef24add973','number','input[aria-label="Weight"]',{done:true});
keyboard('7d8dea8cbab0f554','phone','input[name="phone"]');
keyboard('fcdbbf34054452b1','text','textarea[name="billingQuestion"]');
keyboard('cc6fb2233bc3f31c','text','textarea[name="billingQuestion"]',{symbols:true});
keyboard('b25431078c7923a8 68564002a352ea0b','text','textarea[name="injuryDescription"]');
fs.writeFileSync('docs/reference-fixtures.json', JSON.stringify(fixtures, null, 2));
console.log(`Authored ${Object.keys(fixtures).length} isolated capture fixtures; ${Object.values(fixtures).filter(f => Object.keys(f.ui).some(k=>!k.startsWith("chrome")) || Object.keys(f.data.preferences).length || Object.keys(f.data).length > 8).length} with additional state.`);
