navigator.serviceWorker.register('/sw.js').then(function() {
	console.log('SW registration worked!');
}).catch(function() {
	console.log('Registration failed!');
});
