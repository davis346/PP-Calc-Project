const React = require('react');

// Generic mock for all expo-* packages
module.exports = new Proxy({}, {
  get: (_, key) => {
    if (key === '__esModule') return true;
    if (key === 'default') return {};
    return jest.fn();
  }
});
