const {store,guard,run,go}=require('../../utils/page');
Page({onShow(){if(guard('parent'))this.setData({courses:store.view().courses});},detail(e){const c=this.data.courses.find(x=>x.id===e.currentTarget.dataset.id);wx.showModal({title:c.name,content:c.intro+'\n任课教师：'+c.teacher,showCancel:false});}});
