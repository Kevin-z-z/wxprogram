const {store,guard,run,go}=require('../../utils/page');
Page({onShow(){this.refresh();},refresh(){if(!guard())return;const v=store.view();this.setData({role:v.user.role,items:v.messages});},read(e){const m=this.data.items.find(x=>x.id===e.currentTarget.dataset.id);store.readMessage(m.id);this.refresh();wx.showModal({title:m.title,content:m.body,showCancel:false});}});
