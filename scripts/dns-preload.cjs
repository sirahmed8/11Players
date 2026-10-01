const dns = require('dns');

// Use reliable Google & Cloudflare DNS to prevent local router timeouts
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch {
  // Ignore if not supported in environment
}

const origLookup = dns.lookup;
dns.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  if (!hostname || typeof hostname !== 'string' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname === 'localhost') {
    return origLookup(hostname, options, callback);
  }

  dns.resolve4(hostname, (err, addresses) => {
    if (!err && addresses && addresses.length > 0) {
      if (options && options.all) {
        return callback(
          null,
          addresses.map((addr) => ({ address: addr, family: 4 }))
        );
      }
      return callback(null, addresses[0], 4);
    }
    // Fallback to system resolver if IPv4 resolve didn't return answers
    return origLookup(hostname, options, callback);
  });
};
