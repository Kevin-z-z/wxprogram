const {store,guard,run,go}=require('../../utils/page');
Page({data:{reason:''},onLoad(o){this.id=o.id;},onShow(){if(guard('parent'))run(()=>this.setData({session:store.detail(this.id)}));},input(e){this.setData({reason:e.detail.value});},submit(){if(run(()=>store.requestLeave(this.id,this.data.reason))){wx.showToast({title:'已提交申请'});wx.redirectTo({url:'/pages/leaves/index'});}}});
