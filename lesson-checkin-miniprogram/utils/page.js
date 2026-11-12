const store=require('../services/store');
function guard(role){const user=store.get().user;if(!user){wx.reLaunch({url:'/pages/login/index'});return false;}if(role&&user.role!==role){wx.reLaunch({url:'/pages/'+user.role+'/index'});return false;}return true;}
function run(fn,refresh){try{fn();if(refresh)refresh();return true;}catch(e){wx.showToast({title:e.message||'操作失败',icon:'none'});return false;}}
function go(page,id){wx.navigateTo({url:'/pages/'+page+'/index'+(id?'?id='+encodeURIComponent(id):'')});}
module.exports={store,guard,run,go};
