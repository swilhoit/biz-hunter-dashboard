console.log('TEST: console.log works');
console.error('TEST: console.error works');
process.stdout.write('TEST: stdout works\n');
process.stderr.write('TEST: stderr works\n');

// Test async logging
setTimeout(() => {
  console.log('TEST: Async logging works after 1 second');
}, 1000);

// Test the module import
import('./execute-seller-lookup.js').then(module => {
  console.log('TEST: Successfully imported execute-seller-lookup module');
  console.log('TEST: Module exports:', Object.keys(module));
}).catch(error => {
  console.error('TEST: Failed to import module:', error);
});