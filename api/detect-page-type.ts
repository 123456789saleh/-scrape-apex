import { pageTypeDetector } from '../server/pageTypeDetector.ts';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { url, mode } = req.body || {};
    if (!url) {
      res.status(400).json({ error: 'URL is required' });
      return;
    }

    const report = pageTypeDetector.analyzePage({
      url,
      userSelectedMode: mode || 'products'
    });

    res.status(200).json(report);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
