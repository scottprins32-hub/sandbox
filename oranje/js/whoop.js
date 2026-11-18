// Keep existing bookmarks and WHOOP's registered callback landing page working.
const params = new URLSearchParams(location.search);
const dashboard = new URL('./', location.href);
dashboard.searchParams.set('source', 'whoop');
if (params.has('error')) dashboard.searchParams.set('whoop_error', params.get('error'));
dashboard.hash = '#today';
location.replace(dashboard);
