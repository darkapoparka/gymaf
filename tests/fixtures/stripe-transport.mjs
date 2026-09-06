// Test-only Node preload: redirects Stripe SDK transport to the isolated fixture.
// This file is never imported by application code and never sends a Stripe request.
import https from 'node:https';
import http from 'node:http';
import {syncBuiltinESMExports} from 'node:module';
const original=https.request;
https.request=function(options,callback){
 if(options?.hostname==='api.stripe.com'||options?.host==='api.stripe.com'){
  const request=http.request({...options,hostname:'127.0.0.1',host:'127.0.0.1',port:Number(process.env.TEST_STRIPE_FIXTURE_PORT),protocol:'http:',agent:false},callback);
  request.on('socket',socket=>socket.once('connect',()=>socket.emit('secureConnect')));
  return request;
 }
 return original.apply(this,arguments);
};
syncBuiltinESMExports();
