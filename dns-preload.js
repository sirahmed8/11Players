const dns = require("node:dns");

dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

const originalLookup = dns.lookup;
dns.lookup = function(hostname, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  
  originalLookup(hostname, options, (err, address, family) => {
    if (!err && address) {
      return callback(null, address, family);
    }
    
    // Fallback to Google Public DNS via c-ares resolver
    dns.resolve4(hostname, (resErr, addresses) => {
      if (!resErr && addresses && addresses.length > 0) {
        if (options && options.all) {
          return callback(null, addresses.map(a => ({ address: a, family: 4 })));
        }
        return callback(null, addresses[0], 4);
      }
      return callback(err || resErr);
    });
  });
};
