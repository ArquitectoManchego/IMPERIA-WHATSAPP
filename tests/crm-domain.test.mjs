import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { phoneNumber, validSignature, orderView, notificationFor, stableId, sameData, isContactInactive, DEFAULT_STAGES } from '../src/lib/crm-domain.ts';
test('normalizes Mexican national, international and historical mobile numbers to one identity',()=>{
  for(const p of ['229 123 4567','+52 2291234567','5212291234567@c.us']) assert.equal(phoneNumber(p),'+522291234567');
  assert.equal(phoneNumber('5212345678'),'+525212345678');
  assert.equal(phoneNumber('+14155552671'),'+14155552671');
});
test('never interprets group or LID identities as customer phone numbers',()=>{
  for(const id of ['123456789123@lid','521123456789@g.us','status@broadcast','abc','']) assert.throws(()=>phoneNumber(id));
});
test('validates exact raw body HMAC, not a shared-secret header',()=>{
  const raw='{"event":"message.received","data":{"body":"hola"}}', secret='test-only';
  const signature=createHmac('sha256',secret).update(raw).digest('hex');
  assert.equal(validSignature(raw,signature,secret),true);
  assert.equal(validSignature(raw+' ',signature,secret),false);
  assert.equal(validSignature(raw,secret,secret),false);
  assert.equal(validSignature(raw,null,secret),false);
});
test('manufactured alone is not ready to collect; adjustments block collection notices',()=>{
  assert.equal(orderView({id:'1',status:'Terminado',productionStatus:{fabricado:true}}).ready,false);
  assert.equal(orderView({id:'1',productionStatus:{listoEnTienda:true,requiereAjustes:true}}).ready,false);
  assert.equal(orderView({id:'1',productionStatus:{listoEnTienda:true}}).ready,true);
});
test('first import and delivered orders never trigger notices',()=>{
  const ready=orderView({id:'1',productionStatus:{listoEnTienda:true}});
  assert.equal(notificationFor(null,ready,'2026-09-24'),null);
  assert.equal(notificationFor(ready,{...ready,delivered:true},'2026-09-24'),null);
});
test('ready transition and date changes produce precise notices without invented dates',()=>{
  const previous=orderView({id:'1',nota_id:'42',status:'En Costura'});
  assert.equal(notificationFor(previous,{...previous,ready:true},'2026-09-24').kind,'ready');
  const delayed={...previous,promisedDate:'2026-09-23'};
  const notice=notificationFor(previous,delayed,'2026-09-24');
  assert.equal(notice.kind,'delayed');assert.match(notice.text,/confirmando una nueva fecha/);
  assert.equal(notificationFor(previous,previous,'2026-09-24'),null);
});
test('storage IDs are deterministic and cannot introduce Firestore path segments',()=>{
  assert.equal(stableId('same'),stableId('same'));assert.match(stableId('people/abc'),/^[a-f0-9]{64}$/);
});
test('Firestore map ordering never creates false order changes or cancels valid notifications',()=>{
  assert.equal(sameData({stage:'En Costura',items:[{cantidad:2,descripcion:'Uniforme'}]}, {items:[{descripcion:'Uniforme',cantidad:2}],stage:'En Costura'}),true);
  assert.equal(sameData({stage:'Pendiente'},{stage:'Terminado'}),false);
});
test('detects contact inactivity correctly based on threshold days', () => {
  const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
  assert.equal(isContactInactive(fiveDaysAgo, 3).inactive, true);
  assert.equal(isContactInactive(oneDayAgo, 3).inactive, false);
  assert.equal(isContactInactive(null, 3).inactive, true);
});
test('provides standard pipeline stages with order and names', () => {
  assert.equal(DEFAULT_STAGES.length, 3);
  assert.equal(DEFAULT_STAGES[0].name, 'Nuevo contacto');
  assert.equal(DEFAULT_STAGES[1].name, 'Negociación');
  assert.equal(DEFAULT_STAGES[2].name, 'Cliente');
});

