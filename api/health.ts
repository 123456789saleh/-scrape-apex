export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache');
  res.status(200).json({
    status: 'ok',
    engine: 'ApexScrape Vercel Serverless & Edge Engine v2.5.0',
    platform: 'Vercel Serverless / Client-Side Direct',
    timestamp: new Date().toISOString()
  });
}
