// 演示数据服务。生产版本须替换成后端接口，不能信任客户端角色和余额。
const KEY='lesson-demo-v1';
const copy=x=>JSON.parse(JSON.stringify(x));
function date(offset){const d=new Date();d.setDate(d.getDate()+offset);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');}
function stamp(){return new Date().toLocaleString();}
function seed(){return {user:null,courses:[
 {id:'c1',name:'创意美术基础',category:'艺术启蒙',teacher:'陈老师',className:'周末美术 A 班',location:'教学楼 201',intro:'从色彩与形状出发，学习观察和表达。适合 6 至 9 岁儿童。',enrolled:true,balance:10},
 {id:'c2',name:'少儿硬笔书法',category:'书写训练',teacher:'林老师',className:'书法 B 班',location:'教学楼 202',intro:'练习坐姿、握笔与基本笔画，培养良好的书写习惯。',enrolled:true,balance:8},
 {id:'c3',name:'趣味科学实验',category:'科学探索',teacher:'周老师',className:'科学启蒙班',location:'实验教室',intro:'通过小实验学习科学知识，激发好奇心与动手能力。',enrolled:false,balance:0}],
 students:[{id:'s1',name:'小禾'},{id:'s2',name:'小宇'},{id:'s3',name:'朵朵'}],
 sessions:[
 {id:'a1',courseId:'c1',date:date(0),time:'14:00—15:30',hours:2,cancelled:false,settled:false,activity:null,attendance:{s1:'pending',s2:'present',s3:'pending'}},
 {id:'a2',courseId:'c1',date:date(2),time:'14:00—15:30',hours:2,cancelled:false,settled:false,activity:null,attendance:{s1:'pending',s2:'pending',s3:'pending'}},
 {id:'b1',courseId:'c2',date:date(1),time:'10:00—11:00',hours:1,cancelled:false,settled:false,activity:null,attendance:{s1:'pending'}}],
 balances:{s1:{c1:10,c2:8},s2:{c1:12},s3:{c1:6}},
 leaves:[],checkins:[],ledger:[{id:'l1',studentId:'s1',courseId:'c1',delta:10,reason:'初始购课',time:stamp()},{id:'l2',studentId:'s1',courseId:'c2',delta:8,reason:'初始购课',time:stamp()}],
 orders:[{id:'O20260001',courseId:'c1',amount:'1200.00',hours:10,status:'已完成',refund:'无退款'},{id:'O20260002',courseId:'c2',amount:'640.00',hours:8,status:'已完成',refund:'无退款'}],
 messages:[{id:'m1',role:'parent',title:'欢迎使用课时管理',body:'可在我的课程中查看剩余课时，在课表中查看上课安排。',read:false,time:stamp()}],audit:[]};}
function init(){if(!wx.getStorageSync(KEY))wx.setStorageSync(KEY,seed());}
function get(){init();return copy(wx.getStorageSync(KEY));}
function save(db){wx.setStorageSync(KEY,db);}
function fail(msg){throw new Error(msg);}
function auth(db,role){if(!db.user||db.user.role!==role)fail('当前身份无权执行此操作');}
function session(db,id){return db.sessions.find(x=>x.id===id)||fail('课次不存在');}
function owned(db,s){auth(db,'teacher');if(s.courseId!=='c1')fail('只能管理本人负责的课次');}
function note(db,role,title,body){db.messages.unshift({id:'m'+Date.now()+Math.random(),role,title,body,read:false,time:stamp()});}
function log(db,action,target,reason){db.audit.push({action,target,reason,actor:db.user.name,time:stamp()});}
const labels={pending:'待点名',present:'出勤',leave:'请假',absent:'缺席'};
function enrich(db,s){const course=db.courses.find(c=>c.id===s.courseId);const statuses=Object.values(s.attendance);return {...s,courseName:course.name,teacher:course.teacher,location:course.location,className:course.className,studentStatus:labels[s.attendance.s1],inClass:statuses.length,leaveCount:statuses.filter(x=>x==='leave').length,expected:statuses.filter(x=>x!=='leave').length,present:statuses.filter(x=>x==='present').length,activityLabel:s.activity?({normal:'普通打卡',photo:'拍照打卡',location:'位置打卡'}[s.activity.type]):'尚未发起'};}
module.exports={
 init,get,labels,
 reset(){wx.setStorageSync(KEY,seed());},
 login(role){if(!['parent','teacher'].includes(role))fail('身份错误');const db=get();db.user={role,name:role==='parent'?'小禾家长':'陈老师',studentId:role==='parent'?'s1':null};save(db);},
 logout(){const db=get();db.user=null;save(db);},
 view(){const db=get();if(!db.user)fail('请先登录');const isParent=db.user.role==='parent';return {...db,courses:db.courses.map(c=>({...c,balance:db.balances.s1[c.id]||0})),sessions:db.sessions.filter(s=>isParent?Object.prototype.hasOwnProperty.call(s.attendance,'s1'):s.courseId==='c1').map(s=>enrich(db,s)),messages:db.messages.filter(m=>m.role===db.user.role)};},
 detail(id){const db=get();const s=session(db,id);if(!db.user)fail('请先登录');if(db.user.role==='teacher')owned(db,s);else if(!Object.prototype.hasOwnProperty.call(s.attendance,'s1'))fail('不能查看此课次');return {...enrich(db,s),students:db.students.filter(x=>Object.prototype.hasOwnProperty.call(s.attendance,x.id)).map(x=>({...x,status:s.attendance[x.id],statusLabel:labels[s.attendance[x.id]]})),checkin:db.checkins.find(x=>x.sessionId===id&&x.studentId==='s1')||null};},
 publish(id,type,minutes,location){const db=get(),s=session(db,id);owned(db,s);if(s.cancelled||s.settled)fail('此课次不能发起签到');if(!['normal','photo','location'].includes(type))fail('打卡方式无效');if(type==='location'&&!location)fail('请先获取签到地点');s.activity={type,startAt:Date.now(),endAt:Date.now()+minutes*60000,location:location||null,radius:200};log(db,'发布签到',id,type);note(db,'parent','签到活动已开放',db.courses.find(c=>c.id===s.courseId).name+' 已开放签到，请在活动结束前完成打卡。');save(db);},
 checkin(id,evidence){const db=get(),s=session(db,id);auth(db,'parent');if(!Object.prototype.hasOwnProperty.call(s.attendance,'s1'))fail('未报名此课次');const old=db.checkins.find(x=>x.sessionId===id&&x.studentId==='s1');if(old)return old;if(s.cancelled||s.settled)fail('此课次不能打卡');if(s.attendance.s1==='leave')fail('已批准请假，请联系老师核实');const a=s.activity;if(!a||Date.now()<a.startAt||Date.now()>a.endAt)fail('签到未开始或已结束');if(a.type==='photo'&&!evidence.photo)fail('请先拍摄照片');if(a.type==='location'){
 if(!evidence.location||!a.location)fail('请先获取位置');const rad=x=>x*Math.PI/180, p=evidence.location,q=a.location;const v=Math.sin(rad(q.latitude-p.latitude)/2)**2+Math.cos(rad(p.latitude))*Math.cos(rad(q.latitude))*Math.sin(rad(q.longitude-p.longitude)/2)**2;const distance=6371000*2*Math.asin(Math.min(1,Math.sqrt(v)));if(distance>a.radius)fail('不在允许的打卡范围内');}
 const r={sessionId:id,studentId:'s1',type:a.type,time:stamp(),photo:evidence.photo||''};db.checkins.push(r);s.attendance.s1='present';note(db,'parent','打卡成功','本次打卡已记录，最终考勤由教师核对。');save(db);return r;},
 requestLeave(id,reason){const db=get(),s=session(db,id);auth(db,'parent');if(!Object.prototype.hasOwnProperty.call(s.attendance,'s1'))fail('未报名此课次');if(s.cancelled||s.settled)fail('此课次不能请假');if(new Date(s.date+'T'+s.time.split('—')[0]+':00').getTime()<=Date.now())fail('请在上课开始前提交请假');if(!reason.trim())fail('请填写请假原因');if(db.leaves.some(l=>l.sessionId===id&&['pending','approved'].includes(l.status)))fail('已有待审批或已批准的请假');db.leaves.unshift({id:'q'+Date.now(),studentId:'s1',sessionId:id,reason:reason.trim(),status:'pending',opinion:'',time:stamp()});note(db,'teacher','收到请假申请','小禾提交了一条请假申请，请及时处理。');save(db);},
 cancelLeave(id){const db=get();auth(db,'parent');const l=db.leaves.find(x=>x.id===id&&x.studentId==='s1');if(!l||l.status!=='pending')fail('仅可撤销待审批申请');l.status='cancelled';save(db);},
 approve(id,approved,opinion){const db=get(),l=db.leaves.find(x=>x.id===id);if(!l)fail('申请不存在');const s=session(db,l.sessionId);owned(db,s);if(l.status!=='pending')fail('申请已处理');if(s.settled)fail('已结算，不能直接审批');if(!opinion.trim())fail('请填写审批意见');l.status=approved?'approved':'rejected';l.opinion=opinion.trim();if(approved)s.attendance[l.studentId]='leave';log(db,'请假审批',id,l.opinion);note(db,'parent','请假审批结果',approved?'请假已批准：'+l.opinion:'请假未通过：'+l.opinion);save(db);},
 mark(id,studentId,status,reason){const db=get(),s=session(db,id);owned(db,s);if(s.cancelled||s.settled)fail('已结算或取消的课次不能直接修改');if(!['present','absent'].includes(status))fail('请假状态由审批产生');if(!Object.prototype.hasOwnProperty.call(s.attendance,studentId))fail('学生不属于此班级');if(s.attendance[studentId]==='leave')fail('已批准请假，需通过后续更正流程处理');if(!reason.trim())fail('请填写修改原因');s.attendance[studentId]=status;log(db,'考勤修改',id+'/'+studentId,reason);save(db);},
 settle(id){const db=get(),s=session(db,id);owned(db,s);if(s.settled)return;if(s.cancelled)fail('课程已取消');if(Object.values(s.attendance).some(x=>x==='pending'))fail('请完成所有学生的点名');if(db.leaves.some(x=>x.sessionId===id&&x.status==='pending'))fail('请先处理本次课的待审批请假');const present=Object.keys(s.attendance).filter(x=>s.attendance[x]==='present');for(const sid of present){if((db.balances[sid][s.courseId]||0)<s.hours)fail('有学生课时不足，请先处理余额');}for(const sid of present){db.balances[sid][s.courseId]-=s.hours;db.ledger.unshift({id:'l'+Date.now()+sid,studentId:sid,courseId:s.courseId,sessionId:id,delta:-s.hours,reason:'课程消课',time:stamp()});}s.settled=true;log(db,'确认消课',id,'按出勤人数扣减');note(db,'parent','课时结算完成','本次课程已完成结算，请查看课时明细。');save(db);},
 readMessage(id){const db=get();if(!db.user)fail('请先登录');const m=db.messages.find(x=>x.id===id&&x.role===db.user.role);if(m)m.read=true;save(db);}
};
