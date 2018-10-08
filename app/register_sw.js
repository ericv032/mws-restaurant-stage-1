navigator.serviceWorker.register('/sw.js').then(function() {
	console.log('SW registered!');
}).catch(function() {
	console.log('Registration failed!');
});
