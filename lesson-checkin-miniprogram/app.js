const store = require('./services/store');
App({ onLaunch() { store.init(); } });
