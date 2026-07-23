const WORKER_URL = 'https://api.aikenblanco.com.ar';

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);

  const workerUrl = new URL(url.pathname + url.search, WORKER_URL);

  const modifiedRequest = new Request(workerUrl.toString(), {
    method: context.request.method,
    headers: context.request.headers,
    body: context.request.body,
    redirect: 'follow',
  });

  const response = await fetch(modifiedRequest);

  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', url.origin);
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return newResponse;
};
