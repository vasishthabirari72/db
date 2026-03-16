ServiceWorkerRegistration.register('/service-worker.js')
  .then(function(registration) {
    console.log('Service Worker registered with scope:', registration.scope);
  })
  .catch(function(error) {
    console.error('Error registering Service Worker:', error);
  });