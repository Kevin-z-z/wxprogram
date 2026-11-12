Component({properties:{role:String,active:String},methods:{open(e){const target=e.currentTarget.dataset.page;wx.redirectTo({url:'/pages/'+target+'/index'});}}});
