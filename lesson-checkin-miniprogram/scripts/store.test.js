const assert=require('node:assert/strict');
const memory={};global.wx={getStorageSync:k=>memory[k],setStorageSync:(k,v)=>{memory[k]=JSON.parse(JSON.stringify(v));}};
const s=require('../services/store');s.init();s.login('teacher');
assert.throws(()=>s.publish('b1','normal',30),/只能管理/);
s.publish('a1','normal',30);s.login('parent');s.checkin('a1',{});s.checkin('a1',{});
assert.equal(s.get().checkins.length,1);
s.requestLeave('a2','学校活动');assert.throws(()=>s.requestLeave('a2','重复'),/已有/);
assert.throws(()=>s.settle('a1'),/无权/);
s.login('teacher');s.approve(s.get().leaves[0].id,true,'同意请假');
assert.equal(s.detail('a2').attendance.s1,'leave');
assert.throws(()=>s.settle('a1'),/点名/);
s.mark('a1','s3','absent','人工核对缺席');s.settle('a1');s.settle('a1');
assert.equal(s.get().balances.s1.c1,8);assert.equal(s.get().balances.s2.c1,10);assert.equal(s.get().balances.s3.c1,6);
assert.equal(s.get().ledger.filter(x=>x.sessionId==='a1'&&x.studentId==='s1').length,1);
assert.throws(()=>s.mark('a1','s1','absent','更改'),/不能直接修改/);
// 余额不足时所有学生余额不应出现部分扣减。
s.reset();s.login('teacher');s.mark('a1','s1','present','确认');s.mark('a1','s3','present','确认');
const key=Object.keys(memory)[0];memory[key].balances.s3.c1=0;
assert.throws(()=>s.settle('a1'),/课时不足/);assert.equal(s.get().balances.s1.c1,10);assert.equal(s.get().sessions[0].settled,false);
// 已结束的活动不能签到；审批产生请假后不能打卡。
s.reset();s.login('teacher');s.publish('a1','normal',-1);s.login('parent');assert.throws(()=>s.checkin('a1',{}),/已结束/);
s.requestLeave('a2','身体不适');s.login('teacher');s.approve(s.get().leaves[0].id,true,'同意');s.publish('a2','normal',30);s.login('parent');assert.throws(()=>s.checkin('a2',{}),/已批准请假/);
console.log('PASS: deduplication, permissions, approval, settlement, insufficient balance, expired activity');
