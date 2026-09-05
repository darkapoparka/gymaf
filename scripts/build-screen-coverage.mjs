import fs from 'node:fs';
const flows=JSON.parse(fs.readFileSync('docs/coverage.json','utf8'));
const renderedEvidence=JSON.parse(fs.readFileSync('docs/reference-rendered-evidence.json','utf8'));
const sources=JSON.parse(fs.readFileSync('docs/reference-screens.json','utf8'));
const yoga='/workouts/morning-yoga';
const explicit={
  '8ecb41867a55dcf8':['/welcome','Initial screen'],
  '5043e58748db681f':['/onboarding/contact','Focus Phone Number; the device supplies its keyboard'],
  '5a2d4d735d5445f9':['/onboarding/email','Focus Email; the device supplies its keyboard'],
  '60e50acd6ca18e02':['/onboarding/email','Enter a sample email; keep the input focused'],
  'e189ade08bb8e1eb':['/onboarding/email','Enter a sample email and dismiss the keyboard'],
  'd4a7f160bad9d7dc':['/onboarding/coach','Initial screen'],
  'fecb6b6f3db7308b':['/onboarding/goal','Initial goal selection'],
  '00da8459facd5b2b':['/onboarding/style','No coaching styles selected'],
  '04544bc90c7072a5':['/onboarding/style','Select one or more coaching styles'],
  '40136879a4cf68ac':['/onboarding/intensity','Set the slider to Sometimes intense'],
  'e926bc36ba650bd8':['/onboarding/intensity','Set the slider to A little intense'],
  'f0f3ca0dcba09a07':['/onboarding/matching','Transient matching state'],
  '8dae96b34ae39b84':['/coaches','First recommended coach'],
  'c143403931126a67':['/coaches','Select the final recommendation pagination control'],
  '93b3d967c9f773aa':['/coaches/lee','Top of coach profile'],
  '4050314ce4aaa198':['/coaches/lee','Scroll to About and Certified'],
  '8ee44ade589ce9ac':['/coaches/lee','Scroll to Loves and Located'],
  'cb9726be9e6f072a':['/coaches/search','Initial expertise and style filters'],
  '9bbfbb4408c5aa98':['/coaches/search','Expand expertise'],
  '1ee01f448b7491b4':['/coaches/search','Expand expertise and select Weight Loss'],
  '32e4b5a461cdee6c':['/coaches/results','Filtered coach result list; the local directory is a subset'],
  'ffc4e49a11c1acaf':['/coaches/search','Expand expertise; switch sorting to A–Z'],
  '818823fea239b926':['/checkout','Membership checkout'],
  '10cf3bdb6b6600bd':['/checkout/card','Empty card checkout form'],
  '1c9c16701eb28a46':['/checkout/card','Filled card checkout form; no charge is submitted'],
  'b59ba0346a993f3b':['/onboarding/welcome','Welcome screen'],
  '6786891202a185f3':['/onboarding/booking','Select Mon 29; no time selected'],
  '153228f229e7dca2':['/onboarding/booking','Select Thu 2 at midnight; captured availability is seeded'],
  '7cf1aa5f642fc208':['/onboarding/health','Apple Health introduction; web integration unavailable'],
  '3131962d12621d0d':['/onboarding/details','Edit biological sex, height, date of birth and weight'],
  '3738a7edc0708c90':['/onboarding/activities','Initial activity list'],
  '88bcda17089826ed':['/onboarding/activities','Select CrossFit, Strength Training, Personal Training, HIIT and Swimming'],
  '83b5292282d583e4':['/onboarding/activities','Focus Search or Add Activity'],
  '42bb4a3de314cb9f':['/onboarding/activities','Search Swimming and select the result'],
  'fa153f6aef1d5fba':['/onboarding/setup','Select duration and equipment for Home'],
  '51c3ec60abd95c16':['/onboarding/setup','Choose 60 minutes and add a commercial gym'],
  'f9f9cbadb23780d7':['/onboarding/setup','Open Add Gym; focus gym name'],
  '133c603f4469b7a4':['/onboarding/setup','Open Add Gym; enter Equinox'],
  '2753cde1987791db':['/onboarding/setup','Open Add Gym and choose gym type'],
  '6678002287f3602b':['/onboarding/injuries','Select Yes'],
  '554f8ad3d30873c4':['/onboarding/injuries','Select No'],
  '6129f37fdd7feceb':['/onboarding/notes','Empty notes'],
  'de585df2b0816233':['/onboarding/notes','Enter notes'],
  '92d268dd401589ea':['/onboarding/notifications','Notification introduction'],
  '537d86727616b47e':[null,'Native transition capture; no separately implemented web screen'],
  'b2cf720138e8e91c':['/?activity=kickoff','Booked kickoff home state'],
  'f9ddae79f8fdb799':['/?activity=workout','Today workout home state'],
  '1b0f0590e3ab0639':[yoga,'Workout detail'],
  '8276fa5ae243d824':[yoga+'/session','Start the workout; initial countdown'],
  'b399d75f2cab7473':[yoga+'/session','Collapse controls for the exercise view'],
  'db68d717b839be9c':[yoga+'/session','Select Chaturanga in Overview; expand controls'],
  'df023ddc34d3cc11':[yoga+'/summary','First summary card'],
  'c3aecc2fdeda0fef':[yoga+'/summary','Swipe the summary carousel to another template'],
  '7eb55b06aab6cb7a':[yoga+'/summary?activity=feedback','Create an exercise flag in the session, then open Feedback'],
  '4aeac57b072491f1':[yoga+'/summary?activity=exercises','Top of exercise breakdown'],
  'cc7503a7402e36c1':[yoga+'/summary?activity=exercises','Scroll exercise breakdown'],
};
const rules=[
[/Book your kickoff call/i,'/onboarding/booking','Choose a date and time'],
[/Enter your (phone|email).*get started/i,null,'Enter contact details'],
[/Workout Consistency/i,'/progress/consistency','Open the captured calendar day or week'],
[/Target Weight/i,'/progress/target','Edit weight and units'],
[/Log Weight/i,'/progress/log-weight','Enter weight and date'],
[/Edit Cover Photo/i,'/profile/cover','Choose a local image and adjust zoom'],
[/Edit Profile/i,'/profile/edit','Edit the fields or privacy control shown in the capture'],
[/Progress Photos/i,'/progress/photos','Use Add Photos or select an existing local photo'],
[/My Metrics/i,'/progress/metrics','Add, remove or reorder the captured metric'],
[/Workout Overview/i,yoga+'/session?activity=overview','Select or scroll to the captured exercise'],
[/Adjust Reps/i,yoga+'/session?activity=reps','Adjust repetitions'],
[/Swap Exercise/i,yoga+'/session?activity=swap','Select the replacement and confirm'],
[/Flag Exercise/i,yoga+'/session?activity=flag','Choose reasons, enter a comment and continue'],
[/Exercise History/i,yoga+'/session?activity=history','Select the captured date range'],
[/How was your workout/i,yoga+'/summary?activity=feedback','Set rating, difficulty and feedback; edit or remove a saved flag'],
[/Pay with Credit Card/i,'/checkout/card','Fill the captured form fields'],
[/Shipping Address/i,'/account/shipping','Edit address fields'],
[/Your Membership/i,'/account/membership','Open the displayed membership action'],
[/Workout Settings/i,'/settings/workout','Select the captured settings row'],
[/Exercise Instructions/i,'/settings/instructions','Choose the captured instruction option'],
[/Audio Tones/i,'/settings/tones','Choose and preview an audio tone'],
[/Heart Rate Zones/i,'/settings/zones','View zone thresholds'],
[/Max Heart Rate/i,'/settings/heart-rate','Edit maximum heart rate'],
[/All Equipment/i,'/settings/equipment','Select location, tab, search or filter shown in the capture'],
[/Add New Injury/i,'/settings/injury','Enter injury details and movement impact'],
[/App Settings/i,'/settings/app','Change the displayed preference'],
[/Privacy Policy.*Terms of Service/i,'/settings/about','Open About'],
[/Edit Schedule/i,'/schedule','Add, remove or move a workout; Done opens the comments sheet'],
[/Find Your Coach/i,'/coaches/search','Apply the captured filters or sort order'],
[/Private Profile/i,'/profile/edit','Toggle Private Profile'],
[/Send a free month|Guest Pass/i,'/friends/invite','Show or copy the local invitation'],
];
Object.assign(explicit, JSON.parse(fs.readFileSync('docs/screen-state-recipes.json','utf8').replace(/^\uFEFF/,'')));
const screenshots={'/coaches':'coaches-mobile-v2.png','/settings':'settings-mobile.png','/settings/equipment':'equipment-mobile-v2.png','/profile':'profile-mobile-v2.png','/onboarding/booking':'booking-mobile-v2.png','/onboarding/goal':'onboarding-mobile.png',[yoga+'/session']:'session-mobile-v2.png',[yoga+'/summary']:'summary-mobile-v2.png','/':'home-mobile-v2.png'};
const ledger=sources.map(source=>{
 const text=JSON.parse(fs.readFileSync(source.ocr,'utf8').replace(/^\uFEFF/,'' )).text;
 const membership=source.flows.map(f=>({flowNumber:flows.find(x=>x.id===f.flow).number,screen:f.screen}));
 const flow=flows.find(f=>f.id===source.flows[0].flow);
 let route=flow.route,instructions=`Open ${flow.name}; reproduce the selections and scroll position shown in this capture.`;
 let mapping='Flow entry only — exact state mapping pending';
 const match=explicit[source.id];
 if(match){[route,instructions]=match;mapping=route?'Route and state recipe mapped':'Missing native-only state';}
 else {const rule=rules.find(([regex,target])=>target&&regex.test(text));if(rule){route=rule[1];instructions=rule[2];mapping='Candidate state recipe — manual comparison pending';}}
 const rendered=renderedEvidence[source.id];
 const evidence=rendered ? [rendered.path] : route&&screenshots[route] ? [`.artifacts/${screenshots[route]}`] : [];
 return {id:source.id,source:`/reference/screens/${source.id}.webp`,flows:membership,route,instructions,mapping,visualStatus:'Not verified 1:1',evidence,evidenceScope:rendered ? rendered.scope : evidence.length?'Representative route screenshot; not proof of this exact state':'No exact-state rendered comparison recorded',sourceText:text};
});
if(ledger.length!==270||new Set(ledger.map(s=>s.id)).size!==270)throw Error('Screen ledger does not cover the complete source inventory');
fs.writeFileSync('docs/screen-coverage.json',JSON.stringify(ledger,null,2));
for(const flow of flows)flow.verification='Entry rendered successfully. Individual state parity remains pending; select a capture for its mapping and evidence.';
fs.writeFileSync('docs/coverage.json',JSON.stringify(flows,null,2));
console.log({screens:ledger.length,routeRecipes:ledger.filter(s=>s.mapping==='Route and state recipe mapped').length,candidateRecipes:ledger.filter(s=>s.mapping.startsWith('Candidate')).length,pendingMappings:ledger.filter(s=>s.mapping.startsWith('Flow entry')).length,nativeMissing:ledger.filter(s=>!s.route).length});
