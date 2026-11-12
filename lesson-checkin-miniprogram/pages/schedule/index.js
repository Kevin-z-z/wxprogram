const {store,guard,run,go}=require('../../utils/page');
Page({onShow(){if(!guard())return;const v=store.view();this.setData({role:v.user.role,sessions:v.sessions});},open(e){go('session',e.currentTarget.dataset.id);}});
