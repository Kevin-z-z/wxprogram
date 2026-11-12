const {store,guard,run,go}=require('../../utils/page');
Page({onShow(){if(!guard('parent'))return;const v=store.view();this.setData({courses:v.courses.filter(c=>c.enrolled),items:v.ledger.filter(l=>l.studentId==='s1').map(l=>({...l,courseName:v.courses.find(c=>c.id===l.courseId).name,amount:(l.delta>0?'+':'')+l.delta}))});}});
